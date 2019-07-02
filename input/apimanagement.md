# Batch

> see https://aka.ms/autorest

This is the AutoRest configuration file for Batch.

---

## Getting Started

To build the SDK for ApiManagement, simply [Install AutoRest](https://aka.ms/autorest/install) and in this folder, run:

> `autorest`

To see additional help and options, run:

> `autorest --help`

---

## Configuration

### Basic Information

These are the global settings for the Batch API.

``` yaml
title: ApiManagementClient
openapi-type: arm
```

### All included files should be added here

``` yaml
input-file:
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimanagement.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimapis.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimapisByTags.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimapiversionsets.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimauthorizationservers.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimbackends.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimcaches.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimcertificates.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimdeployment.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimdiagnostics.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimemailtemplates.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimgroups.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimidentityprovider.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimissues.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimloggers.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimnetworkstatus.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimnotifications.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimopenidconnectproviders.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimpolicies.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimpolicysnippets.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimportalsettings.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimproducts.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimproductsByTags.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimproperties.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimquotas.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimregions.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimreports.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimsubscriptions.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimtagresources.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimtags.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimtenant.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/apimusers.json
- /azure-rest-api-specs/specification/apimanagement/resource-manager/Microsoft.ApiManagement/stable/2019-01-01/definitions.json
```

---

# Code Generation

## azureresourceschema

These settings apply only when `--azureresourceschema` is specified on the command line.

``` yaml $(azureresourceschema)
devops:
  cli-name: apimgmt
  azure-arm: true
  license-header: MICROSOFT_MIT_NO_VERSION
  payload-flattening-threshold: 2
  namespace: azure.mgmt.apimanagement
  package-name: azure-mgmt-apimanagement
  clear-output-folder: false
  debug: true
  disable-mm: true
  adjustments:
    "/sku": "Sku*/"
```
