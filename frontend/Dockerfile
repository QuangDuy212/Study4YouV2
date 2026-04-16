# Stage 1: Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Runtime stage
FROM nginx:stable-alpine
# Copy build artifacts từ stage 1
COPY --from=build /app/dist /usr/share/nginx/html
# Copy cấu hình Nginx để handle SPA routing
RUN printf "server { \n\
    listen 80; \n\
    client_max_body_size 100M; \n\
    location / { \n\
        root /usr/share/nginx/html; \n\
        index index.html index.htm; \n\
        try_files \$uri \$uri/ /index.html; \n\
    } \n\
    location /api/v1/uploads/ { \n\
        alias /usr/share/nginx/html/uploads/; \n\
        autoindex off; \n\
    } \n\
    location /uploads/ { \n\
        alias /usr/share/nginx/html/uploads/; \n\
        autoindex off; \n\
    } \n\
    location /api { \n\
        proxy_pass http://backend:8080; \n\
    } \n\
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
