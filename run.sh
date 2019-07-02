cp -rf --verbose /dist /autorest.devops
autorest --devops --use=/autorest.devops --python-sdks-folder=/generated --output-folder=/generated $1
