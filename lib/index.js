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
  }

  update (tableName) {
    return this.describe(tableName)
    .then((res) => {
      const table = res.Table
      const params = {TableName: table.TableName}

      const tableRcu = table.ProvisionedThroughput.ReadCapacityUnits
      const tableWcu = table.ProvisionedThroughput.WriteCapacityUnits

      if (!(tableRcu === 1 && tableWcu === 1)) {
        params.ProvisionedThroughput = {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1
        }
      }

      const gsIndexes = table.GlobalSecondaryIndexes
      if (Array.isArray(gsIndexes) && gsIndexes.length) {
        const updates = []

        gsIndexes.forEach(idx => {
          const name = idx.IndexName
          const rcu = idx.ProvisionedThroughput.ReadCapacityUnits
          const wcu = idx.ProvisionedThroughput.WriteCapacityUnits

          if (!(rcu === 1 && wcu === 1)) {
            updates.push({
              Update: {
                IndexName: name,
                ProvisionedThroughput: {
                  ReadCapacityUnits: 1,
                  WriteCapacityUnits: 1
                }
              }
            })
          }
        })

        if (updates.length) {
          params.GlobalSecondaryIndexUpdates = updates
        }
      }

      if (!params.ProvisionedThroughput && !params.GlobalSecondaryIndexUpdates) {
        return Promise.resolve()
      }

      return this.dynamoDb.updateTable(params).promise()
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

  updateByTags (tags) {
    return this.listByTags(tags)
    .then(tableNames => {
      const promise = tableNames.reduce((prev, curr) => {
        return prev.then(() => this.update(curr))
      }, Promise.resolve())

      return promise.then(() => tableNames)
    })
  }
}

module.exports = new Dynamin()
module.exports.AWS = AWS
