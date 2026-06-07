FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN apt-get update && apt-get install -y procps && rm -rf /var/lib/apt/lists/*

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
