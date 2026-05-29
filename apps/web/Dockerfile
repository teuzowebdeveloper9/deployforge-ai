FROM node:20-alpine
WORKDIR /repo

COPY apps/web/package.json apps/web/package.json

WORKDIR /repo/apps/web
RUN npm install

WORKDIR /repo
COPY apps/web apps/web

WORKDIR /repo/apps/web
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
