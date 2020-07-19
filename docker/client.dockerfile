FROM node:latest

# Install client dependencies
COPY ./package.json client/
RUN cd /client && npm install --no-audit --no-package-lock

# Build client
COPY ./src client/src/
COPY ./public client/public/
COPY ./tsconfig.json client/
RUN cd /client && npm run build

CMD cp /client/build/* /client/out -r && echo "Copied frontend"