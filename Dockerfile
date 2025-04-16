FROM node:18-alpine as development

WORKDIR /app

COPY package.json ./

COPY . .

RUN npm install

RUN npm run build

FROM node:18-alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

COPY package.json ./

COPY . .

RUN npm install

COPY --from=development /app/dist ./dist

CMD ["node", "dist/scripts/campaign-engine.js", "link"]
