# Batch

> see https://aka.ms/autorest

This is the AutoRest configuration file for Automation.

---

## Getting Started

To build the SDK for Automation, simply [Install AutoRest](https://aka.ms/autorest/install) and in this folder, run:

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
  - /azure-rest-api-specs/specification/automation/resource-manager/Microsoft.Automation/preview/2017-05-15-preview/job.json
```

---

# Code Generation

## azureresourceschema

These settings apply only when `--azureresourceschema` is specified on the command line.

``` yaml $(azureresourceschema)
azureresourceschema:
  cli-name: automationjob
  azure-arm: true
  license-header: MICROSOFT_MIT_NO_VERSION
  payload-flattening-threshold: 2
  namespace: azure.mgmt.automation
  package-name: azure-mgmt-automation
  clear-output-folder: false
  disable-mm: true
  disable-azure-cli: true
```
