# Generating Azure CLI Commands

## Prerequisites

The best way of using **autorest.cli** is Docker container.

You need to clone following directories locally. I have added Python SDK here as well, it's not necessary, but may be useful.

    git clone https://github.com/Azure/azure-rest-api-specs
    git clone https://github.com/Azure/azure-cli-extensions.git
    git clone https://github.com/Azure/azure-sdk-for-python.git
    git clone https://github.com/Azure/autorest.cli.git

For simplicity let's assume they are cloned under **c:\dev** directory on Windows machine.

The easiest way to use **autorest.cli** is the container:

    docker run -it --rm -v c:\dev:/_ zikalino/azure-sdk-tools

## Generate Extension

    autorest --cli --use=/_/autorest.cli --cli-module --extension --output-folder=/_/azure-cli-extensions /_/azure-rest-api-specs/specification/frontdoor/resource-manager/readme.md

## Steps to Generate Azure CLI Command from Scratch

There are several steps suggested to generate Azure CLI extension.

### Try all examples from Azure REST API Specs

These examples will be used in Azure CLI extension / Command Module, so it's a good idea to try them, identify all the issues and fix all detected problems.

You can try examples in one of three possible ways:
- Using Python and Azure REST API
- Using Python SDK
- Using Azure CLI and **az rest** command

**autorest.cli** provides a way of converting examples to appropriate format.

### Prepare Python SDK Integration Test

### Generate Command

## Adjusting Command

### Command Name

TBD

### Command Group Naming

TBD

### Disabling Command Groups

TBD

### Flattening Parameters

### Fixing Example Description / Name

Initially example names won't look very good, just like below **ManagedNetworksPut** is not a very good name/description:

    Examples
        ManagedNetworksPut
            az managednetwork create --resource-group "myResourceGroup" --name "myManagedNetwork" \
            --location "eastus"

In order to change this name, find name location in swagger specification:

        "x-ms-examples": {
          "ManagedNetworksPut": {
            "$ref": "./examples/ManagedNetwork/ManagedNetworksPut.json"
          }
        }

and change it to be more descriptive:

        "x-ms-examples": {
          "Create Managed Network": {
            "$ref": "./examples/ManagedNetwork/ManagedNetworksPut.json"
          }
        }


