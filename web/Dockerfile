FROM node:25-slim AS build-stage

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN pnpm install --frozen-lockfile && \
    pnpm build-only


FROM nginx:1.29-alpine AS production-stage

COPY ./nginx.conf /etc/nginx/nginx.conf

WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY config.json /usr/share/nginx/html/

EXPOSE 9949

ARG Version
LABEL bqat_gui.version=$Version

CMD ["nginx", "-g", "daemon off;"]
