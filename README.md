# Dynamin

Dynamin can minimize(i.e. set to `1`) the read and write capacity units of Amazon DynamoDB tables and its indexes.

## Installation
```
$ npm install -g dynamin
```

## Usage
Before using dynamin, you need to set up AWS credentials in some ways:

- `~/.aws/credentials`
- Environment variables


```
$ dynamin --help
Options:
  --help         Show help                                             [boolean]
  --version      Show version number                                   [boolean]
  -t, --table    Table name                                             [string]
  --tags         Lists of tags (keys and values)                         [array]
  --restore      Restores capacity units                               [boolean]
  -r, --region   AWS region                                  [string] [required]
  -p, --profile  Profile name in your credential file                   [string]
```

## Example
Minimize a table.

```
$ dynamin -r ap-northeast-1 -t users
```

Minimize tables tagged with the specified keys and values.  
Dynamin follows the tag filter syntax of [Resource Groups Tagging API](http://docs.aws.amazon.com/resourcegroupstagging/latest/APIReference/API_GetResources.html#resourcegrouptagging-GetResources-request-TagFilters).  
So the following minimizes tables tagged with `(stage=dev or stage=test) and (type=web)`.

```
$ dynamin -r ap-northeast-1 --tags key=stage,values=dev,test key=type,values=web
```

Capacity unit values will be stored in a JSON file located in `~/.config/configstore/dynamin.json`.  
You can restore the values by the following command.

```
$ dynamin -r ap-northeast-1 --restore
```
