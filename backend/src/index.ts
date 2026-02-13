import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";

import requestContext from "./plugins/requestContext";
import { auditRequestPlugin } from "./plugins/auditRequest";


const app = Fastify({
  logger: true,
  trustProxy: true, // IMPORTANT for correct IP behind proxy
});

await app.register(cors, { origin: true });
await app.register(sensible);

await app.register(requestContext);
await app.register(auditRequestPlugin);


// health route
app.get("/health", async () => ({ ok: true }));

// register your routes here...

app.listen({ port: Number(process.env.PORT ?? 3001), host: "0.0.0.0" });
