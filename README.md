# Dynamin

Dynamin can minimize(i.e. set to `1`) the read and write capacity units of Amazon DynamoDB tables and its indexes.

## Installation
```
$ npm install -g dynamin
```

## Usage
Before using dynamin, you need to set AWS credentials and region in some ways:

- `~/.aws/credentials`
- `~/.aws/config`
- Environment variables
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_DEFAULT_REGION`


```
$ dynamin --help
Options:
  --help         Show help                                             [boolean]
  --version      Show version number                                   [boolean]
  -t, --table    Table name                                             [string]
  --tags         Lists of tags (keys and values)                         [array]
  --restore      Restores capacity units                               [boolean]
  -r, --region   AWS region                                             [string]
  -p, --profile  Profile name in your credential file                   [string]
```

## Example
Minimize a table.

```
$ dynamin -t users
```

Minimize tables tagged with the specified keys and values.  
Dynamin follows the tag filter syntax of [Resource Groups Tagging API](http://docs.aws.amazon.com/resourcegroupstagging/latest/APIReference/API_GetResources.html#resourcegrouptagging-GetResources-request-TagFilters).  
So the following minimizes tables tagged with `(stage=dev or stage=test) and (type=web)`.

```
$ dynamin --tags key=stage,values=dev,test key=type,values=web
```

Capacity unit values will be stored in a JSON file located in `~/.config/configstore/dynamin.json`.  
You can restore the values by the following command.

```
$ dynamin --restore
```
