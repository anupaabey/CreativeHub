// Test-only PostgreSQL WASM server. Use Docker PostgreSQL for deployment and concurrency testing.
import {PGlite} from '@electric-sql/pglite';
import {createServer} from 'pglite-server';
import {readFileSync} from 'node:fs';
const db=new PGlite();await db.waitReady;
await db.exec(readFileSync(new URL('../prisma/migrations/202610090001_initial/migration.sql',import.meta.url),'utf8'));
const server=createServer(db);server.listen(5432,'127.0.0.1',()=>console.log('Test-only PostgreSQL WASM ready on 5432'));
process.on('SIGTERM',async()=>{server.close();await db.close();process.exit();});
