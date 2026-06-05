FROM node:20-alpine
WORKDIR /repo

RUN apk add --no-cache openssl

COPY apps/auth-service/package.json apps/auth-service/package.json
COPY apps/auth-service/tsconfig.json apps/auth-service/tsconfig.json
COPY apps/auth-service/tsconfig.build.json apps/auth-service/tsconfig.build.json
COPY apps/auth-service/nest-cli.json apps/auth-service/nest-cli.json
COPY apps/auth-service/.eslintrc.js apps/auth-service/.eslintrc.js
COPY apps/auth-service/prisma apps/auth-service/prisma

WORKDIR /repo/apps/auth-service
RUN npm install

WORKDIR /repo
COPY apps/auth-service apps/auth-service

WORKDIR /repo/apps/auth-service
RUN npx prisma generate && npm run build

EXPOSE 3003
CMD ["node", "dist/main.js"]
