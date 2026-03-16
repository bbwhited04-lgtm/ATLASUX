import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const users = await p.$queryRaw`SELECT id, email, display_name FROM users LIMIT 5`;
console.log('USERS:', JSON.stringify(users, null, 2));

const tenant = await p.$queryRaw`SELECT id, name FROM tenants LIMIT 5`;
console.log('TENANTS:', JSON.stringify(tenant, null, 2));

const assets = await p.$queryRaw`SELECT * FROM assets`;
console.log('EXISTING ASSETS:', JSON.stringify(assets, null, 2));

await p.$disconnect();
