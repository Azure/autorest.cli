# Appendix A3: Docker Tools Cheatsheet

## Getting the Tools

Run following command:

    docker pull mcr.microsoft.com/azure-cli/tools:0.2.1
    
> NOTE: Currently it's necessary to include specific version when pulling. It needs to be figured out how to set **latest** tag to match current version.

## Working with Local Repositories

Run following command:

    docker run -it --rm -v c:\dev:/_ mcr.microsoft.com/azure-cli/tools

## Working with Embedded Repositories

    docker run -it --rm mcr.microsoft.com/azure-cli/tools

## Generating Python SDK

In simplest case you can just type:

    gen-python-package healthcareapis

## Generating Python SDK Integration Test

    gen-python-integration-test healthcareapis

## Generating Azure CLI Extension

    gen-azure-cli <service-name>

## Working with Azure CLI Extensions

### Installing Extension

    azdev extension add <extension-name>

    az <extension-name> --help

### Recording Tests


### Publishing Azure CLI Extension

