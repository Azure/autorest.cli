# Health Care Apis

> see https://aka.ms/autorest

This is the AutoRest configuration file for HealthCareApis.

---

## Getting Started

To build the SDK for HealthCareApis, simply [Install AutoRest](https://aka.ms/autorest/install) and in this folder, run:

> `autorest`

To see additional help and options, run:

> `autorest --help`

---

## Configuration

### Basic Information

These are the global settings for the HealthCareApis.

``` yaml
title: HealthCareApis
openapi-type: arm
```

### All included files should be added here

``` yaml
input-file:
- /azure-rest-api-specs/specification/healthcareapis/resource-manager/Microsoft.HealthcareApis/preview/2018-08-20-preview/healthcare-apis.json
```

---

# Code Generation

## devops

These settings apply only when `--devops` is specified on the command line.

``` yaml $(devops)
devops:
  cli-name: healthcareapis
  azure-arm: true
  license-header: MICROSOFT_MIT_NO_VERSION
  payload-flattening-threshold: 2
  namespace: azure.mgmt.healthcareapis
  package-name: azure-mgmt-healthcareapis
  clear-output-folder: false
  debug: true
  adjustments:
    "/sku": "Sku*/"
  disable-mm: true
```
