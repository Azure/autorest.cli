# Appendix A6: AutoRest Notes

## Model v1

Model v1 i supported in both **autorest** and **autorest-beta**

>NOTE 1: There are some differences in **autorest-beta** that may cause **modeler1** to crash in case of some RPs.

>NOTE 2: **autorest-beta** strips examples from input file.

## Model v3

>NOTE: Model v3 requires **autorest-beta**

Repository:

https://github.com/Azure/autorest.remodeler

## Model v1/v3/v4 Examples

https://github.com/Azure/autorest.cli/tree/master/doc/codemodel-examples

### How to Use in Pipeline

Add following section to use model v3:

    ```
    use-extension:
    "@autorest/remodeler" : "~2.1.0" 
    ```

Add following section to use pipeline v3:

    ``` yaml
    pipeline-model: v3
    ```

And finally add following section in your pipeline:

    ``` yaml
    pipeline:
        remodeler:
            input: openapi-document/multi-api/identity

        cli/generate:
            plugin: cli
            input: remodeler
            output-artifact: source-file-cli

>NOTE: I got **code-model-v3.yaml** as input to **autorest.cli**

## Model v4

>NOTE: Model v4 requires **autorest-beta**

Repository:

https://github.com/Azure/autorest.modelerfour

### How to Use in Pipeline

Add following section to use model v4:

    ```
    use-extension:
    "@autorest/modelerfour" : "~4.1.60" 
    ```

Add following section to use pipeline v3:

    ``` yaml
    pipeline-model: v3
    ```

And finally add following section in your pipeline:

    ``` yaml
    pipeline:
        modelerfour:
            input: openapi-document/multi-api/identity

        cli/generate:
            plugin: cli
            input: modelerfour
            output-artifact: source-file-cli

>NOTE 1: I got **code-model-v4.yaml** and **code-model-v4-no-tags.yaml** as input to **autorest.cli**

>NOTE 2: I noticed some failures, when trying some resources, for instance **healthcareapis**


Input changes from:

    input: openapi-document/identity

to:

    input: openapi-document/multi-api/identity

Second one can be produced only by **autorest-beta**

## CodeModel v3 and v4 comparison

### Top Level

**code-model-v3**

- schemas
- info
- security
- servers
- tags
- http
- commands
- extensions
- details

**code-model-v4**

- schemas
- globalParameters
- info
- operationGroups
- language
- protocols

### Operation Groups

The structure of operation is quite different for v3 and v4 so the code handling it has to be very different.


**code-model-v3**

All operations are grouped together in a single dictionary **/http/operations**

    operations:
      'http-operation:0':
        operationId: ManagedNetworks_Get
        path: '/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ManagedNetwork/managedNetworks/{managedNetworkName}'
        method: get
        description: 'The Get ManagedNetworks operation gets a Managed Network Resource, specified by the resource group and Managed Network name'
        baseUrl: 'https://management.azure.com/'
        deprecated: false
        parameters: ...

**code-model-v4**

Operations are separated into list of operation groups under **/operationGroups**:


    operationGroups:
    - $key: ManagedNetworks
      operations:
    
      - apiVersions:
        - version: 2019-06-01-preview
        request:
          parameters: ...
          language: ...
          protocol:
            http:
              path: '/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ManagedNetwork/managedNetworks/{managedNetworkName}'
              method: get
              uri: '{$host}'
        responses:
          ...
        language:
          default:
            name: Get
            description: 'The Get ManagedNetworks operation gets a Managed Network Resource, specified by the resource group and Managed Network name'
        protocol: {}

### Parameters Definition

....


## Powershell Directives and Code Model Version Considerations

https://github.com/Azure/autorest/blob/master/docs/powershell/directives.md

In general:
- **autorest.powershell** directives' syntax doesn't depend on model version
- internal implementation will be different for v3 and v4
