FROM node:22-slim AS builder

WORKDIR /app

COPY . .

RUN npm install

# Build arg for API URL
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN npx turbo run build --filter=worker_app

FROM nginx:alpine

COPY --from=builder /app/worker_app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
