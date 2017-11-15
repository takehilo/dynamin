# Dynamin

Dynamin can minimize the read and write capacity units of an Amazon DynamoDB table and its indexes.

## Installation
```
$ npm install dynamin
```

## Usage
```
$ dynamin -t <table name> -r <region> [-p <profile>]
```

## Example
```
$ dynamin -t users -r ap-northeast-1 -p dev
```
