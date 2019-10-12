# Generating Azure CLI Commands

## Prerequisites

You need to clone following directories locally:

    git clone https://github.com/Azure/azure-rest-api-specs
    git clone https://github.com/Azure/azure-cli-extensions.git

The easiest way to use **autorest.cli** is the container:

    docker run -it --rm zikalino/azure-sdk-tools ....

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
