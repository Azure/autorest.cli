# Batch

> see https://aka.ms/autorest

This is the AutoRest configuration file for Cosmos DB.

---

## Getting Started

To build the SDK for Cosmos DB, simply [Install AutoRest](https://aka.ms/autorest/install) and in this folder, run:

> `autorest`

To see additional help and options, run:

> `autorest --help`

---

## Configuration

### Basic Information

These are the global settings for the Cosmos DB API.

``` yaml
openapi-type: arm
```

### All included files should be added here

``` yaml
input-file:
  - /azure-rest-api-specs/specification/cosmos-db/resource-manager/Microsoft.DocumentDB/stable/2015-04-08/cosmos-db.json
```

---

# Code Generation

## azureresourceschema

These settings apply only when `--azureresourceschema` is specified on the command line.

``` yaml $(azureresourceschema)
azureresourceschema:
  cli-name: cosmos-db
  azure-arm: true
  license-header: MICROSOFT_MIT_NO_VERSION
  payload-flattening-threshold: 2
  namespace: azure.mgmt.cosmosdb
  package-name: azure-mgmt-cosmosdb
  clear-output-folder: false
```
