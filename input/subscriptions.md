# Recovery Services

> see https://aka.ms/autorest

This is the AutoRest configuration file for Subscription.

---

## Getting Started

To build the SDK for Subscription, simply [Install AutoRest](https://aka.ms/autorest/install) and in this folder, run:

> `autorest`

To see additional help and options, run:

> `autorest --help`

---

## Configuration

### Basic Information

These are the global settings for the Subscription.

``` yaml
title: Subscription
openapi-type: arm
```

### All included files should be added here

``` yaml
input-file:
- /azure-rest-api-specs/specification/subscription/resource-manager/Microsoft.Subscription/preview/2018-03-01-preview/subscriptions.json
```

---

# Code Generation

## devops

These settings apply only when `--devops` is specified on the command line.

``` yaml $(devops)
devops:
  cli-name: subscription
  azure-arm: true
  license-header: MICROSOFT_MIT_NO_VERSION
  payload-flattening-threshold: 2
  namespace: azure.mgmt.subscriptions
  package-name: azure-mgmt-subscriptions
  clear-output-folder: false
  debug: true
  adjustments:
    "/sku": "Sku*/"
  disable-mm: true
  disable-azure-cli: true
```
