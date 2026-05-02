const express = require('express');
const cors = require('cors');
const path = require('path');

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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅  мини-сервис-деск запущен`);
  console.log(`   Открой браузер: http://localhost:${PORT}\n`);
});
