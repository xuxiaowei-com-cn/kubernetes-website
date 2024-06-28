# Credit to Julien Guyomard (https://github.com/jguyomard). This Dockerfile
# is essentially based on his Dockerfile at
# https://github.com/jguyomard/docker-hugo/blob/master/Dockerfile. The only significant
# change is that the Hugo version is now an overridable argument rather than a fixed
# environment variable.

FROM docker.io/library/golang:1.20-alpine as builder

LABEL maintainer="Luc Perkins <lperkins@linuxfoundation.org>"

ARG HUGO_VERSION
ARG URL
ARG TAG

RUN echo $URL && \
    echo $TAG && \
    apk add --no-cache \
    make \
    curl \
    gcc \
    g++ \
    musl-dev \
    build-base \
    libc6-compat  \
    runuser \
    git \
    openssh-client \
    rsync \
    npm && \
    mkdir $HOME/src && \
    cd $HOME/src && \
    curl -L https://github.com/gohugoio/hugo/archive/refs/tags/v${HUGO_VERSION}.tar.gz | tar -xz && \
    cd "hugo-${HUGO_VERSION}" && \
    go install --tags extended && \
    npm install -D autoprefixer postcss-cli && \
    git clone --branch $TAG --depth 1 $URL /website && \
    cd /website && \
    ls -l && \
    make module-init && \
    make api-reference && \
    sed -i "s#url = \"https://kubernetes.io\"#url = \"https://kubernetes.xuxiaowei.com.cn\"#" /website/hugo.toml && \
    sed -i "s#https://v1-29.docs.kubernetes.io#https://kubernetes-v1-29.xuxiaowei.com.cn#" /website/hugo.toml && \
    sed -i "s#https://v1-28.docs.kubernetes.io#https://kubernetes-v1-28.xuxiaowei.com.cn#" /website/hugo.toml && \
    sed -i "s#https://v1-27.docs.kubernetes.io#https://kubernetes-v1-27.xuxiaowei.com.cn#" /website/hugo.toml && \
    sed -i "s#https://v1-26.docs.kubernetes.io#https://kubernetes-v1-26.xuxiaowei.com.cn#" /website/hugo.toml && \
    sed -i "s#https://v1-25.docs.kubernetes.io#https://kubernetes-v1-25.xuxiaowei.com.cn#" /website/hugo.toml && \
    sed -i "s#https://v1-24.docs.kubernetes.io#https://kubernetes-v1-24.xuxiaowei.com.cn#" /website/hugo.toml && \
    sed -i "s#京ICP备17074266号-3#鲁ICP备19009036号-1#" /website/layouts/partials/footer.html && \
    sed -i "s#https://cdn-images.mailchimp.com/embedcode/horizontal-slim-10_7.css#/horizontal-slim-10_7.css#" /website/layouts/index.html && \
    sed -i "s#https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v27.0.1/dist/font-face.css#/font-face.css#" /website/themes/docsy/assets/scss/rtl/_main.scss && \
    sed -i "s#https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v27.0.1/dist/font-face.css#/font-face.css#" /website/api-ref-generator/themes/docsy/assets/scss/rtl/_main.scss && \
    ls -l public || echo "public 文件夹不存在" && \
    npm ci && hugo --minify --environment development && \
    ls -l public

FROM nginx:1.27.0

LABEL maintainer="徐晓伟 <xuxiaowei@xuxiaowei.com.cn>"

ARG CI_PIPELINE_URL
ARG TAG
ENV CI_PIPELINE_URL=$CI_PIPELINE_URL
ENV TAG=$TAG

ADD docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /website/public /usr/share/nginx/html

RUN curl -o /usr/share/nginx/html/horizontal-slim-10_7.css https://cdn-images.mailchimp.com/embedcode/horizontal-slim-10_7.css && \
    curl -o /usr/share/nginx/html/font-face.css https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v27.0.1/dist/font-face.css && \
    sed -i '/http {/a\    server_tokens off;' /etc/nginx/nginx.conf

#RUN mkdir -p /var/hugo && \
#    addgroup -Sg 1000 hugo && \
#    adduser -Sg hugo -u 1000 -h /var/hugo hugo && \
#    chown -R hugo: /var/hugo && \
#    runuser -u hugo -- git config --global --add safe.directory /src

#COPY --from=0 /go/bin/hugo /usr/local/bin/hugo

#WORKDIR /src

#USER hugo:hugo

#EXPOSE 1313
