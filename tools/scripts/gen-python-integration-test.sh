set -x
autorest --cli --use=/_/autorest.cli --python-integration-test --output-folder=/_/azure-sdk-for-python /_/azure-rest-api-specs/specification/$1/resource-manager/readme.md
