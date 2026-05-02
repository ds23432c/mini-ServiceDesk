const fs = require('fs/promises');
const path = require('path');
const db = require('./db');

function cleanSchemaSql(sql) {
  return sql
    .replace(/^\s*--.*$/gm, '')
    .replace(/CREATE DATABASE IF NOT EXISTS servicedesk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\s*/i, '')
    .replace(/USE servicedesk;\s*/i, '')
    .trim();
}

function splitStatements(sql) {
  return sql
    .split(';')
    .map(statement => statement.trim())
    .filter(Boolean);
}

function isInsertStatement(statement) {
  return /^INSERT\s+INTO/i.test(statement);
}

async function runStatements(statements) {
  for (const statement of statements) {
    await db.query(statement);
  }
}

async function initializeDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const rawSchema = await fs.readFile(schemaPath, 'utf8');
  const statements = splitStatements(cleanSchemaSql(rawSchema));

  const ddlStatements = statements.filter(statement => !isInsertStatement(statement));
  const seedStatements = statements.filter(isInsertStatement);

  await runStatements(ddlStatements);

  const [[clientsCount]] = await db.query('SELECT COUNT(*) AS count FROM clients');
  if (Number(clientsCount.count) === 0) {
    await runStatements(seedStatements);
  }
}

module.exports = {
  initializeDatabase
};
