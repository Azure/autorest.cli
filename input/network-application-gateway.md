# Network

> see https://aka.ms/autorest
This is the AutoRest configuration file for Network.

---

## Getting Started

To build the SDK for Network, simply [Install AutoRest](https://aka.ms/autorest/install) and in this folder, run:

> `autorest`
To see additional help and options, run:

> `autorest --help`
---

## Configuration

### Basic Information

These are the global settings for the Network API.

``` yaml
title: NetworkManagementClient
description: Network Client
openapi-type: arm
tag: package-2019-06
```

### All included files should be added here

``` yaml
input-file:
  - /azure-rest-api-specs/specification/network/resource-manager/Microsoft.Network/stable/2019-06-01/webapplicationfirewall.json
```

---

# Code Generation

## cli

These settings apply only when `--cli` is specified on the command line.

``` yaml $(cli)
cli:
  cli-name: network
  azure-arm: true
  license-header: MICROSOFT_MIT_NO_VERSION
  payload-flattening-threshold: 2
  namespace: azure.mgmt.network
  package-name: azure-mgmt-network
  clear-output-folder: false
  debug: true
  #disable-mm: fasle
  disable-azure-cli: true