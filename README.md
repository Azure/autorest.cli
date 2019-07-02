
# [WORK IN PROGRESS !]

See documentation [here](MANUAL.md)


``` yaml
use-extension:
  "@microsoft.azure/autorest.modeler": "2.3.44"

pipeline:
    devops: # <- name of plugin
        scope: devops
        # ^ will make this plugin run only when `--hello` is passed on the CLI or

    #python/imodeler1:
    #    input: openapi-document/identity
    #    output-artifact: code-model-v1
    #    scope: devops

```
    

#``` yaml 
#use-extension:
#  "devops": "$(this-folder)"
#```
