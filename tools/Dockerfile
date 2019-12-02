FROM ubuntu
MAINTAINER zikalino

RUN apt-get update
RUN apt-get install -y python3 python3-pip python3-venv git curl gnupg

RUN apt-get install -y software-properties-common
RUN apt-get install -y apt-transport-https
RUN add-apt-repository "deb http://security.ubuntu.com/ubuntu xenial-security main"
RUN apt-get update
RUN apt-get install -y libicu55
RUN apt-get install -y wget
RUN wget -q https://packages.microsoft.com/config/ubuntu/18.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
RUN dpkg -i packages-microsoft-prod.deb
RUN add-apt-repository universe
RUN apt-get update
RUN apt-get install -y dotnet-sdk-2.2
RUN apt-get install -y

RUN apt-get install -y nodejs
RUN apt-get install -y npm

RUN apt-get install -y libunwind-dev

# Autorest
RUN npm install -g autorest

# AutoRest v3 beta
RUN npm install -g @autorest/autorest

RUN npm install -g typescript
RUN npm install -g n
RUN n 10.15.0
RUN apt-get -y install vim

# clone repos locally
WORKDIR /_
RUN git clone https://github.com/Azure/autorest.cli.git
RUN git clone https://github.com/Azure/azure-sdk-for-python.git
RUN git clone https://github.com/Azure/azure-rest-api-specs.git
RUN git clone https://github.com/Azure/azure-cli.git
RUN git clone https://github.com/Azure/azure-cli-extensions.git

RUN python3 -m venv /env
ENV VIRTUAL_ENV /env
ENV PATH /env/bin:$PATH

RUN pip3 install wheel
RUN pip3 install azdev
RUN pip3 install six==1.12

RUN cd autorest.cli; npm install; tsc -p tsconfig.json

# this is just to trigger setup of basic packages
RUN cd /_/azure-sdk-for-python; python ./scripts/dev_setup.py -p azure-mgmt-healthcareapis

RUN azdev setup -r /_/azure-cli-extensions -c /_/azure-cli

ADD scripts /scripts
RUN sed -i 's/\r//g' /scripts/*
ENV PATH /scripts:$PATH

# ENTRYPOINT ["bash", "/scripts/run.sh"]
