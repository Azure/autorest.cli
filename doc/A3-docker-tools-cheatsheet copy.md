# Appendix A3: Docker Tools Cheatsheet

## Working with Local Repositories

Run following command:

    docker run -it --rm -v c:\dev:/_ zikalino/azure-sdk-tools-v2

## Working with Embedded Repositories

    docker run -it --rm zikalino/azure-sdk-tools-v2

## Generating Python SDK

In simplest case you can just type:

    gen-python-package healthcareapis

## Generating Python SDK Integration Test

    gen-python-integration-test healthcareapis

## Generating Azure CLI Extension

TBD

## Recording Azure CLI Extension Tests

TBD

## Publishing Azure CLI Extension

TBD