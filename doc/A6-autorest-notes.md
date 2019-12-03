# Appendix A6: AutoRest Notes

## Model v1

Model v1 i supported in both **autorest** and **autorest-beta**

>NOTE 1: There are some differences in **autorest-beta** that may cause **modeller1** to crash in case of some RPs.

>NOTE 2: **autorest-beta** strips examples from input file.

## Model v3

>NOTE: Model v3 requires **autorest-beta**

Repository:

https://github.com/Azure/autorest.remodeler

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
