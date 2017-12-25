'use strict'

const AWS = require('aws-sdk')

class Dynamin {
  get dynamoDb () {
    if (this._dynamoDb) {
      return this._dynamoDb
    }

    this._dynamoDb = new AWS.DynamoDB()
    return this._dynamoDb
  }

  get resourceGroupsTaggingApi () {
    if (this._resourceGroupsTaggingApi) {
      return this._resourceGroupsTaggingApi
    }

    this._resourceGroupsTaggingApi = new AWS.ResourceGroupsTaggingAPI()
    return this._resourceGroupsTaggingApi
  }

  describe (tableName) {
    const params = {TableName: tableName}
    return this.dynamoDb.describeTable(params).promise()
    .then(res => {
      const table = {
        name: tableName,
        indexes: []
      }

      table.read = res.Table.ProvisionedThroughput.ReadCapacityUnits
      table.write = res.Table.ProvisionedThroughput.WriteCapacityUnits

      const gsIndexes = res.Table.GlobalSecondaryIndexes
      if (Array.isArray(gsIndexes) && gsIndexes.length) {
        gsIndexes.forEach(idx => {
          table.indexes.push({
            name: idx.IndexName,
            read: idx.ProvisionedThroughput.ReadCapacityUnits,
            write: idx.ProvisionedThroughput.WriteCapacityUnits
          })
        })
      }

      return table
    })
  }

  listByTags (tags) {
    let tableNames = []

    function getResources (paginationToken) {
      if (paginationToken === '') {
        return Promise.resolve()
      }

      const params = {
        TagFilters: tags.map(t => ({Key: t.key, Values: t.values})),
        ResourceTypeFilters: ['dynamodb:table'],
        ResourcesPerPage: 5
      }

      if (paginationToken !== undefined) {
        params.PaginationToken = paginationToken
      }

      return this.resourceGroupsTaggingApi.getResources(params).promise()
      .then(res => {
        tableNames = tableNames.concat(res.ResourceTagMappingList.map(r => r.ResourceARN.split('/')[1]))
        return getResources.call(this, res.PaginationToken)
      })
    }

    return getResources.call(this).then(() => tableNames)
  }

  update (table) {
    const params = {TableName: table.name}

    if (table.read || table.write) {
      params.ProvisionedThroughput = {
        ReadCapacityUnits: table.read,
        WriteCapacityUnits: table.write
      }
    }

    if (table.indexes.length) {
      const updates = table.indexes.map(idx => ({
        Update: {
          IndexName: idx.name,
          ProvisionedThroughput: {
            ReadCapacityUnits: idx.read,
            WriteCapacityUnits: idx.write
          }
        }
      }))

      params.GlobalSecondaryIndexUpdates = updates
    }

    return this.dynamoDb.updateTable(params).promise()
  }

  minimize (tableName) {
    return this.describe(tableName)
    .then(tableOrig => {
      const table = this.deepCopy(tableOrig)

      if (table.read === 1 && table.write === 1) {
        delete table.read
        delete table.write
      } else {
        table.read = 1
        table.write = 1
      }

      if (table.indexes.length) {
        table.indexes = table.indexes
          .filter(idx => idx.read !== 1 || idx.write !== 1)
          .map(idx => {
            idx.read = 1
            idx.write = 1
            return idx
          })
      }

      if (!table.read && !table.indexes.length) {
        return Promise.resolve()
      }

      return this.update(table)
      .then(() => {
        return tableOrig
      })
    })
  }

  deepCopy (obj) {
    return JSON.parse(JSON.stringify(obj))
  }
}

module.exports = new Dynamin()
module.exports.AWS = AWS
