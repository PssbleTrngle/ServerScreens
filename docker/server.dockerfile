FROM node:latest

RUN apt-get update \
    && apt-get install -y software-properties-common --no-install-recommends

#RUN add-apt-repository 'deb [arch=amd64] http://ftp.gnu.org/gnu/screen/ multiverse' \
RUN add-apt-repository 'deb http://ftp.gnu.org/gnu/ screen' \
    && cat /etc/apt/sources.list \
    && apt-get update \
    && apt-get install -y screen --no-install-recommends

# Install server dependencies
COPY ./package.json server/
RUN cd /server && npm install --no-audit --no-package-lock

# Build server
COPY ./src server/src/
COPY ./tsconfig.json ./ormconfig.ts server/

RUN cd /server && npm run build

CMD cd /server && npm run run