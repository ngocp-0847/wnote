This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/zeit/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

# Deploy in AWS
### EC2 + OPENSEARCH

Nginx setting (For EC2 AWS)

```
server {
    server_name 3.128.204.249;
    access_log /opt/nextjs/logs/access.log;
    error_log /opt/nextjs/logs/error.log error;

    location /_next/ {
        alias /var/www/html/wnote/.next/;
        expires 30d;
        access_log on;
    }

    location / {
        # reverse proxy for next server
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # we need to remove this 404 handling
        # because next's _next folder and own handling
        # try_files $uri $uri/ =404;
    }
}

```

Create index for search ES:
```
curl -X PUT "http://localhost:9200/wnote"
```

Install pm2:
```
npm install pm2@latest -g
```

Run pm2 for build app and run background for web:
```
pm2 start yarn --interpreter bash --name nextjs -- start
```
