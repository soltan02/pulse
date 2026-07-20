# ---- Step 1: Build React SPA ----
FROM node:20-slim AS client-build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Step 2: Production server ----
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=client-build /app/node_modules ./node_modules
COPY --from=client-build /app/dist ./dist
COPY --from=client-build /app/prisma ./prisma
COPY --from=client-build /app/package.json ./
COPY --from=client-build /app/index.html ./

EXPOSE 3000
CMD ["node", "dist/index.js"]
