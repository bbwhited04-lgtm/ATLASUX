import { buildServer } from "./server.js";

const app = await buildServer();

const port = Number(process.env.PORT ?? 8787);

try {
  await app.listen({
    port,
    host: "0.0.0.0",
  });
  console.log(`🚀 Server running on 0.0.0.0:${port}`);
} catch (err) {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
}
