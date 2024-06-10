const puppeteer = require('puppeteer');
const express = require('express');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware para ler JSON do body da requisição
app.use(express.json());

// Endpoint para lidar com a URL do Envato
app.post('/download', async (req, res) => {
  const { envatoUrl } = req.body;

  if (!envatoUrl) {
    return res.status(400).json({ error: 'Envato URL is required' });
  }

  try {
    const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Configura os cookies na página
    await page.setCookie(...cookies);

    await page.goto(envatoUrl);

    await page.waitForSelector('button[data-testid="action-bar-download-button"]');
    await page.click('button[data-testid="action-bar-download-button"]');

    await page.waitForSelector('button[data-testid="download-without-license"]');
    await page.click('button[data-testid="download-without-license"]');

    await page.setRequestInterception(true);
    
    let downloadUrl = '';
    
    page.on('request', request => {
      const url = request.url();
      if (url.indexOf('download') > -1 && !url.includes('download_and_license') && !url.includes('facebook')) {
        downloadUrl = url;
        request.abort(); // Aborta a requisição para não prosseguir com o download
        browser.close(); // Fecha o navegador
        res.json({ downloadUrl }); // Retorna o link de download na resposta da API
      } else {
        request.continue();
      }
    });

    // Mantenha o navegador aberto para interceptar o download
    // Caso contrário, use await browser.close() quando quiser fechar o navegador
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
