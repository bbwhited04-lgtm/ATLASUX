import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrate: {
    // Prisma will read DATABASE_URL from your environment / .env file
    datasource: "db",
  },
});
