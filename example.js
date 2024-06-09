import puppeteer from 'puppeteer';
import fs from 'fs';

const browser = await puppeteer.launch({
  headless: false,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.56 Safari/537.36']
});
const page = await browser.newPage();

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.56 Safari/537.36']
  });

  const page = await browser.newPage();

  if (fs.existsSync('cookies.json')) {
    const cookiesString = fs.readFileSync('cookies.json');
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);

    await page.goto('https://elements.envato.com/pt-br/mockup-powerpoint-YURFKTE');
    await page.waitForSelector('button[data-testid="action-bar-download-button"]');
    await page.click('button[data-testid="action-bar-download-button"]');

    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = request.url();
      if (url.indexOf('download') > -1 && !url.includes('download_and_license') && !url.includes('facebook')) {
        console.log('Download URL: ' + url);
        page.evaluate((url) => {
          window.open(url, '_blank');
        }, url);
      }
      request.continue();
    });

    const client = await page.target().createCDPSession();
    await client.send('Network.setRequestInterception', {
      patterns: [{
        urlPattern: '*',
        resourceType: 'Document',
        interceptionStage: 'HeadersReceived'
      }],
    });

    client.on('Network.requestIntercepted', async e => {
      const headers = e.responseHeaders || {};
      const contentType = headers['content-type'] || headers['Content-Type'] || '';
      const obj = { interceptionId: e.interceptionId };
      if (contentType.indexOf('application/zip') > -1) {
        obj['errorReason'] = 'BlockedByClient';
      }
      await client.send('Network.continueInterceptedRequest', obj);
    });

    await page.waitForSelector('button[data-testid="download-without-license"]');
    await page.click('button[data-testid="download-without-license"]');

  } else {
    await page.goto('https://elements.envato.com/sign-in/with-token?token=sSD4eX7zXmwNvBMKm6B3nVy4O6P4rleiv1TcBY03CQW7DuuxRO3Au2xZjERIw4Ib&utm_nooverride=1');
    const cookies = await page.cookies();
    fs.writeFile('cookies.json', JSON.stringify(cookies, null, 2), function (error) {
      if (error) console.log('Error has occured');
    });
  }

  // await browser.close();
})();

const login = async (url) => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko)']
  });
  const page = await browser.newPage();
  await page.goto(url);
  const cookies = await page.cookies();
  fs.writeFile('cookies.json', JSON.stringify(cookies, null, 2), function (error) {
    if (error) console.log('Error has occured');
  });
}

const download = async (url) => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko)']
  });
  const page = await browser.newPage();
  const cookiesString = fs.readFileSync('cookies.json');
  const cookies = JSON.parse(cookiesString);
  await page.setCookie(...cookies);

  await page.goto('https://elements.envato.com/admin-template-adminto-E85H4R');
  await page.waitForSelector('button[data-testid="action-bar-download-button"]');
  await page.click('button[data-testid="action-bar-download-button"]');

  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = request.url();
    if (url.indexOf('download') > -1 && !url.includes('download_and_license') && !url.includes('facebook')) {
      console.log('Download URL: ' + url);
      page.evaluate((url) => {
        window.open(url, '_blank');
      }, url);
    }
    request.continue();
  });

  const client = await page.target().createCDPSession();
  await client.send('Network.setRequestInterception', {
    patterns: [{
      urlPattern: '*',
      resourceType: 'Document',
      interceptionStage: 'HeadersReceived'
    }],
  });

  client.on('Network.requestIntercepted', async e => {
    const headers = e.responseHeaders || {};
    const contentType = headers['content-type'] || headers['Content-Type'] || '';
    const obj = { interceptionId: e.interceptionId };
    if (contentType.indexOf('application/zip') > -1) {
      obj['errorReason'] = 'BlockedByClient';
    }
    await client.send('Network.continueInterceptedRequest', obj);
  });

  await page.waitForSelector('button[data-testid="download-without-license"]');
  await page.click('button[data-testid="download-without-license"]');
}
