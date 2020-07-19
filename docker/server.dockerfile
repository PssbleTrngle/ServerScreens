FROM node:latest

RUN apt-get update \
    && apt-get install -y screen --no-install-recommends

# Install server dependencies
COPY ./package.json server/
RUN cd /server && npm install --no-audit --no-package-lock

# Build server
COPY ./src server/src/
COPY ./tsconfig.json ./ormconfig.ts server/

RUN cd /server && npm run build

CMD cd /server && npm run run