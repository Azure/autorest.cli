
# [WORK IN PROGRESS !]

See documentation [here](MANUAL.md)


``` yaml
use-extension:
  "@microsoft.azure/autorest.modeler": "2.3.45" # keep in sync with package.json's dev dependency in order to have meaningful tests

pipeline:
    devops: # <- name of plugin
        scope: devops
        # ^ will make this plugin run only when `--devops` is passed on the CLI or

    devops/imodeler1:
        input: openapi-document/identity
        output-artifact: code-model-v1
        scope: devops
    devops/commonmarker:
        input: imodeler1
        output-artifact: code-model-v1
    devops/cm/transform:
        input: commonmarker
        output-artifact: code-model-v1
    devops/cm/emitter:
        input: transform
        scope: scope-cm/emitter
    devops/generate:
        plugin: devops
        input: cm/transform
        output-artifact: source-file-devops
    devops/transform:
        input: generate
        output-artifact: source-file-devops
        scope: scope-transform-string
    devops/emitter:
        input: transform
        scope: scope-devops/emitter

scope-devops/emitter:
  input-artifact: source-file-devops
  output-uri-expr: $key

output-artifact:
- source-file-devops
```
    

#``` yaml 
#use-extension:
#  "devops": "$(this-folder)"
#```
