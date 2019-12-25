FROM node:8-alpine

RUN mkdir /app
WORKDIR /app

COPY src ./src
COPY package.json .
COPY .env .

ENV NODE_ENV=production
RUN npm install -g nodemon
RUN npm install --production

COPY moleculer.config.js ./

EXPOSE 4445
EXPOSE 3000

CMD ["npm", "start"]
