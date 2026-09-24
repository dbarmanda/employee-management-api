# Before production docker setup.

# FROM node:24-alpine
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci
# COPY . .
# EXPOSE 3000
# # CMD ["npm", "start"]
# CMD ["node", "--inspect=0.0.0.0:9229", "server.js"]

# --------------------------------------------------
# Stage 1: Install production dependencies
# --------------------------------------------------

FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# --------------------------------------------------
# Stage 2: Production runtime
# --------------------------------------------------
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=dependencies --chown=node:node \  /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node . .
# RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "server.js"]


