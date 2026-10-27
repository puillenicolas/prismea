'use strict';
const { Pool } = require('pg');

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL manquant'); process.exit(1); }
const local = /localhost|127\.0\.0\.1|\/var\/run|host=\//.test(url);
const pool = new Pool({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false }, max: 10 });

async function migrate() {
  await pool.query(`
    create table if not exists users(
      id serial primary key,
      login text unique not null,
      nom text not null,
      password_hash text,
      must_change boolean not null default true,
      created_at timestamptz not null default now()
    );
    create table if not exists entities(
      kind text not null,
      id text not null,
      data jsonb not null,
      deleted boolean not null default false,
      updated_at timestamptz not null default clock_timestamp(),
      updated_by integer references users(id),
      primary key(kind,id)
    );
    create index if not exists entities_updated on entities(updated_at);
    create table if not exists files(
      id text primary key,
      nom text not null,
      type text not null,
      size integer not null,
      data bytea not null,
      created_at timestamptz not null default now(),
      created_by integer references users(id)
    );
  `);
}

module.exports = { pool, migrate };
