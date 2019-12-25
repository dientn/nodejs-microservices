FROM node:8-alpine

RUN mkdir /app
WORKDIR /app

COPY package.json .
COPY src ./src
COPY .env .

ENV NODE_ENV=production

RUN npm install --production

COPY moleculer.config.js ./

EXPOSE 4445
EXPOSE 9229

CMD ["npm", "start"]
