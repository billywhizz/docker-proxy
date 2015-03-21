FROM gliderlabs/alpine:latest
RUN apk-install --virtual nodejs
ADD app /app
