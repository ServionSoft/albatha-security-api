import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();

const HOST = process.env.HOST || "0.0.0.0";
const server = app.listen(env.PORT, HOST, () => {
  console.log(`Albatha API listening on ${env.PUBLIC_BASE_URL} (bind ${HOST}:${env.PORT})`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
