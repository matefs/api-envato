const puppeteer = require('puppeteer');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3005;

// Middleware para ler JSON do body da requisição
app.use(express.json());

// Servir o arquivo HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});


// Endpoint para retornar uma mensagem JSON
app.get('/mateus', (req, res) => {
  res.json({ mensagem: 'Tudo funcionando' });
});

// Endpoint para lidar com a URL do Envato
app.post('/download', async (req, res) => {
  const { envatoUrl } = req.body;

  if (!envatoUrl) {
    console.error('Envato URL is required');
    return res.status(400).json({ error: 'Envato URL is required' });
  }

  try {
    console.log('Reading cookies file...');
    const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));

    console.log('Launching Puppeteer...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    console.log('Setting cookies...');
    await page.setCookie(...cookies);

    console.log('Navigating to Envato URL...');
    await page.goto(envatoUrl, { waitUntil: 'networkidle2' });

    console.log('Waiting for download button...');
    await page.waitForSelector('button[data-testid="action-bar-download-button"]');
    await page.click('button[data-testid="action-bar-download-button"]');

    console.log('Waiting for license-free download button...');
    await page.waitForSelector('button[data-testid="download-without-license"]');
    await page.click('button[data-testid="download-without-license"]');

    console.log('Setting request interception...');
    await page.setRequestInterception(true);

    let downloadUrl = '';

    page.on('request', async request => {
      const url = request.url();
      if (url.indexOf('download') > -1 && !url.includes('download_and_license') && !url.includes('facebook')) {
        downloadUrl = url;
        console.log('Download URL:', downloadUrl); // Depuração
        await request.abort(); // Aborta a requisição para não prosseguir com o download
        await browser.close(); // Fecha o navegador
        return res.json({ downloadUrl }); // Retorna o link de download na resposta da API
      } else {
        request.continue();
      }
    });

  } catch (error) {
    console.error('Error during processing:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
