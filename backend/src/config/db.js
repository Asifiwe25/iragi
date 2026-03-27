// backend/src/config/db.js
require('dotenv').config();
const { Pool } = require('pg');

let poolConfig;

if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };
} else {
  poolConfig = {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME     || 'iragi',
    user:     process.env.DB_USER     || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
  };
}

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ PostgreSQL connected');
  }
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err.message);
});

module.exports = pool;
