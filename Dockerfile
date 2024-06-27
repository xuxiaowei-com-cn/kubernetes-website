# Credit to Julien Guyomard (https://github.com/jguyomard). This Dockerfile
# is essentially based on his Dockerfile at
# https://github.com/jguyomard/docker-hugo/blob/master/Dockerfile. The only significant
# change is that the Hugo version is now an overridable argument rather than a fixed
# environment variable.

FROM docker.io/library/golang:1.20-alpine as builder

LABEL maintainer="Luc Perkins <lperkins@linuxfoundation.org>"

RUN apk add --no-cache \
    curl \
    gcc \
    g++ \
    musl-dev \
    build-base \
    libc6-compat

ARG HUGO_VERSION
ARG CI_PROJECT_DIR
ARG TAG

RUN mkdir $HOME/src && \
    cd $HOME/src && \
    curl -L https://github.com/gohugoio/hugo/archive/refs/tags/v${HUGO_VERSION}.tar.gz | tar -xz && \
    cd "hugo-${HUGO_VERSION}" && \
    go install --tags extended

FROM docker.io/library/golang:1.20-alpine

RUN apk add --no-cache \
    runuser \
    git \
    openssh-client \
    rsync \
    npm && \
    npm install -D autoprefixer postcss-cli && \
    cd $CI_PROJECT_DIR/$TAG && \
    ls -l public || echo "public 文件夹不存在" && \
    npm ci && hugo --minify --environment development && \
    ls -l public

FROM nginx:1.27.0

LABEL maintainer="徐晓伟 <xuxiaowei@xuxiaowei.com.cn>"

ARG CI_PROJECT_DIR
ARG CI_PIPELINE_URL
ENV CI_PIPELINE_URL=$CI_PIPELINE_URL

COPY --from=builder $CI_PROJECT_DIR/public /usr/share/nginx/html

#RUN mkdir -p /var/hugo && \
#    addgroup -Sg 1000 hugo && \
#    adduser -Sg hugo -u 1000 -h /var/hugo hugo && \
#    chown -R hugo: /var/hugo && \
#    runuser -u hugo -- git config --global --add safe.directory /src

#COPY --from=0 /go/bin/hugo /usr/local/bin/hugo

#WORKDIR /src

#USER hugo:hugo

#EXPOSE 1313
