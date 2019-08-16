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
  - /azure-rest-api-specs/specification/servicebus/resource-manager/Microsoft.ServiceBus/stable/2017-04-01/servicebus.json
```

---

# Code Generation

## cli

These settings apply only when `--cli` is specified on the command line.

``` yaml $(cli)
cli:
  cli-name: servicebus
  azure-arm: true
  license-header: MICROSOFT_MIT_NO_VERSION
  payload-flattening-threshold: 2
  namespace: azure.mgmt.servicebus
  package-name: azure-mgmt-servicebus
  clear-output-folder: false
  disable-mm: true
  disable-azure-cli: true
```
