FROM zikalino/autorest.devops.base
MAINTAINER zikalino

ADD . /autorest.devops
# RUN cd /autorest.devops; npm install
ENTRYPOINT ["bash", "/autorest.devops/run.sh"]
