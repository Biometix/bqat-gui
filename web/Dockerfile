# syntax=docker/dockerfile:1

# build stage
FROM node:20 AS build-stage

WORKDIR /app

COPY . .

RUN yarn set version stable && \
    yarn install && \
    yarn build-only

# production stage
FROM nginx AS production-stage

COPY ./nginx.conf /etc/nginx/nginx.conf

WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY config.json /usr/share/nginx/html/

EXPOSE 9949

ARG Version
LABEL bqat_gui.version=$Version

CMD ["nginx", "-g", "daemon off;"]
