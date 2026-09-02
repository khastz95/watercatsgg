import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  text.split(/\r?\n/).forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith("#")) return;
    const i = t.indexOf("=");
    if (i < 1) return;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  });
}

loadEnv(path.join(root, ".env"));
loadEnv(path.join(root, ".env.local"));
loadEnv(path.resolve(root, "../camp-x1/.env"));

const url =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.CAMPX1_POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

if (!url) {
  console.error("Sem DATABASE_URL — o site usa o documento org no Postgres até as tabelas existirem.");
  process.exit(2);
}

const sql = postgres(url, { ssl: "require", max: 1 });
const schema = fs.readFileSync(path.join(root, "supabase-org.sql"), "utf8");

try {
  await sql.unsafe(schema);
  console.log("Tabelas da organização aplicadas.");
} finally {
  await sql.end();
}
