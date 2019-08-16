# Recovery Services

> see https://aka.ms/autorest

This is the AutoRest configuration file for Batch.

---

## Getting Started

To build the SDK for RecoverySerices, simply [Install AutoRest](https://aka.ms/autorest/install) and in this folder, run:

> `autorest`

To see additional help and options, run:

> `autorest --help`

---

## Configuration

### Basic Information

These are the global settings for the Recovery Services.

``` yaml
title: RecoveryServices
openapi-type: arm
```

### All included files should be added here

``` yaml
input-file:
- /azure-rest-api-specs/specification/recoveryservices/resource-manager/Microsoft.RecoveryServices/stable/2016-06-01/vaults.json
```

---

# Code Generation

## cli

These settings apply only when `--cli` is specified on the command line.

``` yaml $(cli)
cli:
  cli-name: recoveryservices
  azure-arm: true
  license-header: MICROSOFT_MIT_NO_VERSION
  payload-flattening-threshold: 2
  namespace: azure.mgmt.recoveryservices
  package-name: azure-mgmt-recoveryservices
  clear-output-folder: false
  debug: true
  adjustments:
    "/sku": "Sku*/"
  disable-mm: true
  disable-azure-cli: true
```
