# Management Groups

> see https://aka.ms/autorest

This is the AutoRest configuration file for Management Groups.

---

## Getting Started

To build the SDK for Management Groups, simply [Install AutoRest](https://aka.ms/autorest/install) and in this folder, run:

> `autorest`

To see additional help and options, run:

> `autorest --help`

---

## Configuration

### Basic Information

These are the global settings for the Management Groups API.

``` yaml
title: ManagementGroupsClient
openapi-type: arm
```

### All included files should be added here

``` yaml
input-file:
- /azure-rest-api-specs/specification/managementgroups/resource-manager/Microsoft.Management/preview/2018-03-01-preview/management.json
```

---

# Code Generation

## azureresourceschema

These settings apply only when `--azureresourceschema` is specified on the command line.

``` yaml $(azureresourceschema)
azureresourceschema:
  azure-arm: true
  license-header: MICROSOFT_MIT_NO_VERSION
  payload-flattening-threshold: 2
  namespace: azure.mgmt.managementgroups
  package-name: azure-mgmt-managementgroups
  clear-output-folder: false
```
