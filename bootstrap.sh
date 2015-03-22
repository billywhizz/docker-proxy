#cd /tmp
#wget https://raw.githubusercontent.com/billywhizz/docker-proxy/master/alpine-proxy.tar.gz
#docker load -i alpine-proxy.tar.gz
#docker run -d -e PROXY_PORT=8001 -e BACKEND_PORT=80 -e PROXY_HOST=0.0.0.0 -e BACKEND_HOST=stage.oneflowcloud.com -p 8001:8001 alpine/proxy sh /app/start.sh
#rm -f alpine-proxy.tar.gz
docker pull $1
docker run -d -e PROXY_PORT=8001 -e BACKEND_PORT=80 -e PROXY_HOST=0.0.0.0 -e BACKEND_HOST=stage.oneflowcloud.com -p 8001:8001 $1 sh /app/start.sh
