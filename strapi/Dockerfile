# syntax=docker/dockerfile:1
# Dòng trên cực kỳ quan trọng để kích hoạt BuildKit features

# --- STAGE 1: BUILD ---
FROM node:20-alpine AS build

# Cài đặt build-tools cần thiết cho sharp và các native modules
RUN apk update && apk add --no-cache \
    build-base \
    gcc \
    autoconf \
    automake \
    zlib-dev \
    libpng-dev \
    vips-dev \
    git > /dev/null 2>&1

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/
COPY package.json yarn.lock ./
COPY scripts ./scripts

# SỬ DỤNG CACHE MOUNT Ở ĐÂY:
# target trỏ tới thư mục cache của yarn trong container.
# Khi build lần sau, Docker sẽ mount folder cache cũ vào đây,
# giúp yarn không phải tải lại những gói đã có.
RUN --mount=type=cache,target=/root/.yarn \
    yarn config set network-timeout 3600000 -g && \
    yarn install

WORKDIR /opt/app
COPY . .
ENV PATH=/opt/node_modules/.bin:$PATH
RUN yarn build

# --- STAGE 2: RUNTIME ---
FROM node:20-alpine
RUN apk add --no-cache vips-dev
ENV NODE_ENV=production

WORKDIR /opt/
COPY --from=build /opt/node_modules ./node_modules

WORKDIR /opt/app
COPY --from=build /opt/app ./

# Cấu hình Path để nhận diện lệnh strapi
ENV PATH=/opt/node_modules/.bin:$PATH

# Tăng bộ nhớ cho Node.js khi build Admin
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Phân quyền cho user node để đảm bảo bảo mật (Security-First)
RUN mkdir -p /opt/app/public/uploads /opt/app/src/extensions/documentation/documentation && \
    chown -R node:node /opt/app
USER node

EXPOSE 1337
CMD ["yarn", "start"]
