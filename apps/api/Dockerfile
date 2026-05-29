FROM node:20-alpine
WORKDIR /repo

RUN apk add --no-cache openssl

COPY apps/api/package.json apps/api/package.json
COPY apps/api/tsconfig.json apps/api/tsconfig.json
COPY apps/api/tsconfig.build.json apps/api/tsconfig.build.json
COPY apps/api/nest-cli.json apps/api/nest-cli.json
COPY apps/api/.eslintrc.js apps/api/.eslintrc.js
COPY apps/api/prisma apps/api/prisma

WORKDIR /repo/apps/api
RUN npm install

WORKDIR /repo
COPY apps/api apps/api

WORKDIR /repo/apps/api
RUN npx prisma generate && npm run build

EXPOSE 3001
CMD ["node", "dist/main.js"]
