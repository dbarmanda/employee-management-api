# Before production docker setup.

FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
# CMD ["npm", "start"]
CMD ["node", "--inspect=0.0.0.0:9229", "server.js"]

