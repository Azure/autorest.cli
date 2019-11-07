# Batch

> see https://aka.ms/autorest

This is the AutoRest configuration file for Batch.

---

## Getting Started

To build the SDK for Batch, simply [Install AutoRest](https://aka.ms/autorest/install) and in this folder, run:

> `autorest`

To see additional help and options, run:

> `autorest --help`

---

## Configuration

### Basic Information

These are the global settings for the Batch API.

``` yaml
openapi-type: arm
```

### All included files should be added here

``` yaml
input-file:
  - ../../azure-rest-api-specs/specification/batch/resource-manager/Microsoft.Batch/stable/2018-12-01/BatchManagement.json
```

---

# Code Generation

## cli

These settings apply only when `--cli` is specified on the command line.

``` yaml $(cli)
cli:
  cli-name: batch
  azure-arm: true
  license-header: MICROSOFT_MIT_NO_VERSION
  payload-flattening-threshold: 2
  namespace: azure.mgmt.batch
  package-name: azure-mgmt-batch
  clear-output-folder: false
  adjustments:
    "/properties/autoStorage/lastkeysync": "hide"
    "/properties/autostorage": "autoStorageAccountId/"
    "/properties/provisioningstate": "hide"
    "/properties/dedicatedcorequota": "hide"
    "/properties/lowprioritycorequota": "hide"
    "/properties/poolquota": "hide"
    "/properties/activejobandjobschedulequota": "hide"
    "/name": "hide"
    "/type": "hide"
  debug: true
  disable-azure-cli: true
```
