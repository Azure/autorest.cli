# Generating Azure CLI Commands

## Prerequisites

- Python SDK is already generated
- Integration Tests for Python SDK are generated and validated
- Minimal **readme.cli.md** file is already in place

## Manual Generation

### Prepare Your Environment

If you don't have installed AutoRest tools yet, the best way to start is using Docker container.

You will need to clone following directories locally.

    git clone https://github.com/Azure/azure-rest-api-specs

For simplicity let's assume they are cloned under **c:\dev** directory on Windows machine.

If you want to use the container:

    docker run -it --rm -v c:\dev:/_ mcr.microsoft.com/azure-cli/tools

## Generate Integration Test

Following command will generate default Azure CLI extension considering all ther prerequisites are in place

    autorest --cli --use-extension="{'@autorest/cli':'latest'}" --integration-test --output-folder=/_/ /_/azure-rest-api-specs/specification/frontdoor/resource-manager/readme.md

## Running Integration Test

Firstly, install **azdev**

    pip install azdev

then setup your test environment:

    azdev setup -c pypi

Login:

    az login

You need to add test manually (this will change later when tools are improved):

    vi ~/.azdev/env_config/env/test_index/latest.json

and add:

    {
      "mytest": "/_/test_..... your test name.......py"
    }

Then you can run the test:

    azdev test mytest
