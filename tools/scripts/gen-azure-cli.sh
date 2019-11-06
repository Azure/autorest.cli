set -x
autorest --cli --use=/_/autorest.cli --cli-module --extension --output-folder=/_/azure-cli-extensions /_/azure-rest-api-specs/specification/${1}/resource-manager/readme.md
