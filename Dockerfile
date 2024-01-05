FROM node:20.10.0-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .
RUN npm run compile

ENV PORT=3000
EXPOSE $PORT

CMD ["npm", "run", "prod"]