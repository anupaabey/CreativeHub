import { execFileSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
const run = (args, env = process.env) => execFileSync(process.execPath, args, { cwd: root, env, stdio: 'inherit' });
run(['node_modules/prisma/build/index.js', 'generate', '--schema', 'prisma/schema.prisma']);
if (process.env.VERCEL_ENV === 'production' && process.env.CREATIVEHUB_APPLY_MIGRATIONS === 'true') {
  const env = { ...process.env, DATABASE_URL: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL };
  run(['node_modules/prisma/build/index.js', 'migrate', 'deploy', '--schema', 'prisma/schema.prisma'], env);
  run(['--import', 'tsx', 'prisma/seed.ts'], env);
}
execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
