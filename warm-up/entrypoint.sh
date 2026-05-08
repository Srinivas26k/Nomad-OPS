#!/bin/sh
# Cloud Run injects $PORT. nginx.conf uses ${PORT} variable.
# envsubst replaces it before nginx starts.
export PORT="${PORT:-8080}"
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf > /tmp/default.conf
cp /tmp/default.conf /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
