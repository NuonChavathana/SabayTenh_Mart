FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY database/package.json ./database/
COPY packages/api-zod/package.json ./packages/api-zod/
COPY packages/api-client-react/package.json ./packages/api-client-react/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @workspace/db build
RUN pnpm --filter @workspace/api-server build

EXPOSE 8080

CMD ["node", "backend/dist/index.mjs"]