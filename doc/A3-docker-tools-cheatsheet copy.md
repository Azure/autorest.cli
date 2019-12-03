# Appendix A3: Docker Tools Cheatsheet

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

