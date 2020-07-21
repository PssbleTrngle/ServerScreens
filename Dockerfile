FROM node:latest

ENV SCREEN_VERSION=4.6.2

# Download GNU Screen
WORKDIR /tmp
ADD http://git.savannah.gnu.org/cgit/screen.git/snapshot/v.${SCREEN_VERSION}.tar.gz screen.tar.gz
RUN tar -xvf screen.tar.gz

# Build GNU Screen
RUN cd v.${SCREEN_VERSION}/src && ./autogen.sh && ./configure && make
ENV PATH="/tmp/v.${SCREEN_VERSION}/src:${PATH}"

# Install client dependencies
WORKDIR /client
COPY ./client/package.json .
RUN npm install --no-audit --no-package-lock

# Install server dependencies
WORKDIR /server
COPY ./server/package.json ./
RUN npm install --no-audit --no-package-lock

# Build client
WORKDIR /client
COPY ./client/src ./src/
COPY ./client/public ./public/
COPY ./client/tsconfig.json .
RUN npm run build

# Build server
WORKDIR /server
COPY ./server/src ./src/
COPY ./server/tsconfig.json ./server/ormconfig.ts ./

RUN npm run build

CMD cd /server && npm run run