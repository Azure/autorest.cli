set -x
curdir = $(pwd)
cd /_/azure-sdk-for-python
python ./scripts/dev_setup.py -p azure-mgmt-$1
python -m packaging_tools.generate_sdk -v -m /_/azure-rest-api-specs/specification/$1/resource-manager/readme.md
cd $curdir
