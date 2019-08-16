cp -rf --verbose /source/dist /autorest.cli
cp -rf --verbose /source/input /autorest.cli
autorest --cli --use=/autorest.cli --python-sdks-folder=/generated --output-folder=/generated $1
