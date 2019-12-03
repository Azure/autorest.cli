See documentation [here](doc/00-overview.md)

``` yaml
use-extension:
  "@microsoft.azure/autorest.modeler": "2.3.45" # keep in sync with package.json's dev dependency in order to have meaningful tests

pipeline:
    cli/generate:
        plugin: cli
        input: modelerfour
        output-artifact: source-file-cli
    cli/transform:
        input: generate
        output-artifact: source-file-cli
        scope: scope-transform-string
    cli/emitter:
        input: transform
        scope: scope-cli/emitter

scope-cli/emitter:
  input-artifact: source-file-cli
  output-uri-expr: $key

output-artifact:
- source-file-cli
```

#``` yaml 
#use-extension:
#  "cli": "$(this-folder)"
#```
