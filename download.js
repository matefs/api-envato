const puppeteer = require('puppeteer');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3005;

// Middleware to parse JSON from the request body
app.use(express.json());

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to handle Envato URL
app.post('/download', async (req, res) => {
  const { envatoUrl } = req.body;

  if (!envatoUrl) {
    console.error('Envato URL is required');
    return res.status(400).json({ error: 'Envato URL is required' });
  }

  let browser;
  try {
    console.log('Reading cookies file...');
    const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));

    console.log('Launching Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-zygote',
        '--single-process', // Single process (useful for server environments)
        '--disable-gpu'
      ]
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
      if (url.includes('download') && !url.includes('download_and_license') && !url.includes('facebook')) {
        downloadUrl = url;
        console.log('Download URL:', downloadUrl);
        await request.abort(); // Abort the request to avoid downloading the file
        await browser.close(); // Close the browser
        return res.json({ downloadUrl }); // Return the download link in the API response
      } else {
        request.continue();
      }
    });

  } catch (error) {
    console.error('Error during processing:', error);
    if (browser) await browser.close(); // Ensure browser is closed on error
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
