See documentation [here](MANUAL.md)


``` yaml
use-extension:
  "@microsoft.azure/autorest.modeler": "2.3.45" # keep in sync with package.json's dev dependency in order to have meaningful tests

pipeline:
    #cli: # <- name of plugin
    #    scope: cli
    #    # ^ will make this plugin run only when `--cli` is passed on the CLI or

    cli/imodeler1:
        input: openapi-document/identity
        output-artifact: code-model-v1
        scope: cli
    cli/commonmarker:
        input: imodeler1
        output-artifact: code-model-v1
    cli/cm/transform:
        input: commonmarker
        output-artifact: code-model-v1
    cli/cm/emitter:
        input: transform
        scope: scope-cm/emitter
    cli/generate:
        plugin: cli
        input: cm/transform
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
