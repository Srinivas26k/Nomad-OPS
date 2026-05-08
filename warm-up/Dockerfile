FROM nginx:alpine

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy static files
COPY index.html  /usr/share/nginx/html/
COPY styles.css  /usr/share/nginx/html/
COPY script.js   /usr/share/nginx/html/

# Copy nginx config (listens on $PORT)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run injects $PORT — nginx reads it via envsubst at startup
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080
CMD ["/entrypoint.sh"]
