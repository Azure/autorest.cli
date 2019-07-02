cp -rf --verbose /source/dist /autorest.devops
cp -rf --verbose /source/input /autorest.devops
autorest --devops --use=/autorest.devops --python-sdks-folder=/generated --output-folder=/generated $1
