# Generating Python SDK Integration Test

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

## Configuration in **readme.cli.md** File

NOTE: The same configuration will be used to generate Azure CLI commands tests.

In order to generate Python integration test you will need to create **readme.cli.md** file next to **readme.md** file in Azure REST API specification repository:

The file should have following format:

    ## CLI

    These settings apply only when `--cli` is specified on the command line.

    ``` yaml $(cli)
    cli:
        cli-name: appservice
        package-name: azure-mgmt-web
        namespace: azure.mgmt.web
        test-setup:
            - name: "Create Or Update App Service plan"
    ```

Under **test-setup** section you need to include example IDs from the specification. You can find them in JSON file, for instance, the example included here you can find in:

**/azure-rest-api-specs/specification/web/resource-manager/Microsoft.Web/stable/2019-08-01/AppServicePlans.json**

    "x-ms-examples": {
        "Create Or Update App Service plan": {
        "$ref": "./examples/CreateOrUpdateAppServicePlan.json"
        }
    },

## Generating Test

Run:

    autorest --cli --use=/_/autorest.cli --python-integration-test --output-folder=/_/generated /_/azure-rest-api-specs/specification/web/resource-manager/readme.md


