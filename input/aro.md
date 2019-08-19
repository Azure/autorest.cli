# Managed OpenShift

> see https://aka.ms/autorest

This is the AutoRest configuration file for Managed OpenShift (ARO).

---

## Getting Started

To build the SDK for Managed OpenShift, simply [Install AutoRest](https://aka.ms/autorest/install) and in this folder, run:

> `autorest`

To see additional help and options, run:

> `autorest --help`

---

## Configuration

### Basic Information

These are the global settings for the Managed OpenShift.

``` yaml
title: OpenShift
openapi-type: arm
```

### All included files should be added here

``` yaml
input-file:
- /azure-rest-api-specs/specification/containerservice/resource-manager/Microsoft.ContainerService/stable/2019-04-30/openShiftManagedClusters.json
```

---

# Code Generation

## cli

These settings apply only when `--cli` is specified on the command line.

``` yaml $(cli)
cli:
  cli-name: aro
  azure-arm: true
  license-header: MICROSOFT_MIT_NO_VERSION
  payload-flattening-threshold: 2
  namespace: azure.mgmt.containerservice
  package-name: azure-mgmt-containerservice
  clear-output-folder: false
  debug: true
  adjustments:
    "/sku": "Sku*/"
    "/properties/authenticationconfiguration": "Authentication*/"
    "/properties/corsconfiguration": "Cors*/"
    "/properties/cosmosdbconfiguration": "CosmosDb*/"
    "/properties/accesspolicies": "AccessPolicies*/"
  disable-mm: true
```
