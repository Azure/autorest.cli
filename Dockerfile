FROM ubuntu:xenial
MAINTAINER zikalino

RUN apt-get update
RUN apt-get install -y git curl gnupg

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y nodejs
RUN npm -g install autorest

RUN curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
RUN mv microsoft.gpg /etc/apt/trusted.gpg.d/microsoft.gpg
RUN sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/microsoft-ubuntu-xenial-prod xenial main" > /etc/apt/sources.list.d/dotnetdev.list'
RUN apt-get update
RUN apt-get install -y apt-transport-https libcurl3 libicu55
RUN apt-get install -y dotnet-runtime-2.0.5
RUN apt-get install -y dotnet-sdk-2.1.4 

RUN apt-get install -y software-properties-common build-essential
RUN curl -#LO https://rvm.io/mpapis.asc
RUN gpg --import mpapis.asc
RUN curl -L https://get.rvm.io | bash -s stable --ruby
RUN rvm install 2.6.0
RUN rvm use 2.6.0
RUN rvm rubygems latest
RUN apt-get update
RUN gem install bundler
