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
        throw Error(`Capacity units of ${tableName} and its indexes have already been mimimized.`)
      }

      return this.dynamoDb.updateTable(params).promise()
    })
  }
}

module.exports = new Dynamin()
module.exports.AWS = AWS
