See documentation [here](doc/00-overview.md)

``` yaml
use-extension:
  "@autorest/modelerfour" : "~4.1.60" 
  "@autorest/remodeler" : "~2.1.0" 
```

> Multi-Api Mode
``` yaml
pipeline-model: v3
```

``` yaml

pipeline:

    # "Shake the tree", and normalize the model
    modelerfour:
        input: openapi-document/multi-api/identity     # the plugin where we get inputs from
    remodeler:
        input: openapi-document/multi-api/identity     # the plugin where we get inputs from

    cli/generate:
        plugin: cli
        input: remodeler
        output-artifact: source-file-cli

scope-here:
  is-object: false
  output-artifact:
    - source-file-cli

output-artifact:
- source-file-cli
```

#``` yaml 
#use-extension:
#  "cli": "$(this-folder)"
#```
