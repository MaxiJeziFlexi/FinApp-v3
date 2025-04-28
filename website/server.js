const express = require('express');
const path = require('path');

const app = express();
const port = 4000;

app.use(express.json());

console.log('Katalog główny aplikacji:', __dirname);

app.use(express.static('public'));
app.use('/webui', express.static(path.join(__dirname, 'webui')));

// Routing dla podstron HTML
app.get(['/', '/web.html'], (req, res) => {
  const filePath = path.join(__dirname, 'webui/webpages/web.html');
  res.sendFile(filePath);
});

app.get(['/aboutus', '/aboutus.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'webui/webpages/aboutus.html'));
});

app.get(['/team', '/team.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'webui/webpages/team.html'));
});

app.get(['/usecase', '/usecase.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'webui/webpages/usecase.html'));
});

app.listen(port, () => {
  console.log(`Serwer działa na http://localhost:${port}`);
});