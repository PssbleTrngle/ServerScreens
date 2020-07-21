FROM node:latest

ENV SCREEN_VERSION=4.6.2

# Download GNU Screen
WORKDIR /tmp
ADD http://git.savannah.gnu.org/cgit/screen.git/snapshot/v.${SCREEN_VERSION}.tar.gz screen.tar.gz
RUN tar -xvf screen.tar.gz

# Build GNU Screen
RUN cd v.${SCREEN_VERSION}/src && ./autogen.sh && ./configure && make
ENV PATH="/tmp/v.${SCREEN_VERSION}/src:${PATH}"

WORKDIR /server

# Install server dependencies
COPY ./package.json ./
RUN npm install --no-audit --no-package-lock

# Build server
COPY ./src ./src/
COPY ./tsconfig.json ./ormconfig.ts ./

RUN npm run build

CMD npm run run