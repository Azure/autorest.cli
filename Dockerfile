FROM zikalino/autorest.cli.base
MAINTAINER zikalino

ADD . /autorest.cli
# RUN cd /autorest.cli; npm install
ENTRYPOINT ["bash", "/autorest.cli/run.sh"]
