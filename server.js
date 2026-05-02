const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./init_db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api', require('./routes/entities'));

app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = Number(process.env.PORT || 3000);

function getServiceUrl(port) {
  const host =
    process.env.RAILWAY_PUBLIC_DOMAIN ||
    process.env.RAILWAY_STATIC_URL ||
    process.env.PUBLIC_URL;

  if (host) {
    return host.startsWith('http') ? host : `https://${host}`;
  }

  return `http://localhost:${port}`;
}

async function start() {
  await initializeDatabase();

  app.listen(PORT, '0.0.0.0', () => {
    const serviceUrl = getServiceUrl(PORT);

    console.log('\n✅  мини-сервис-деск запущен');
    console.log(`   Открой браузер: ${serviceUrl}\n`);
  });
}

start().catch(error => {
  console.error('❌  Ошибка запуска сервера:', error);
  process.exit(1);
});
