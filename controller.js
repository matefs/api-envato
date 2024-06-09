import puppeteer from 'puppeteer';
import fs from 'fs';

const login = async (req, res) => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox"]
    });
    const page = await browser.newPage();
    const { url } = req.body;
    await page.goto(url);
    const cookies = await page.cookies();
    fs.writeFile('cookies.json', JSON.stringify(cookies, null, 2), function (error) {
        if (error) console.log('Error has occurred');
    });
    res.json({
        status: true,
        message: page.url()
    });
    await browser.close();
};

const download = async (req, res) => {
    const { url } = req.body;
    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox"]
    });
    const page = await browser.newPage();

    let responseSent = false;

    const timeout = setTimeout(async () => {
        if (!responseSent) {
            res.json({
                status: false,
                message: 'Download failed'
            });
            responseSent = true;
            await browser.close();
        }
    }, 30000);

    try {
        const cookiesString = fs.readFileSync('cookies.json');
        const cookies = JSON.parse(cookiesString);
        await page.setCookie(...cookies);

        await page.goto(url);
        await page.waitForSelector('button[data-testid="action-bar-download-button"]');
        await page.click('button[data-testid="action-bar-download-button"]');

        const client = await page.target().createCDPSession();
        await client.send('Network.setRequestInterception', {
            patterns: [{
                urlPattern: '*',
                resourceType: 'Document',
                interceptionStage: 'HeadersReceived'
            }],
        });

        client.on('Network.requestIntercepted', async e => {
            let headers = e.responseHeaders || {};
            let contentType = headers['content-type'] || headers['Content-Type'] || '';
            let obj = { interceptionId: e.interceptionId };
            if (contentType.indexOf('application/zip') > -1) {
                obj['errorReason'] = 'BlockedByClient';
            }

            await client.send('Network.continueInterceptedRequest', obj);
            await browser.close();
        });

        await page.waitForSelector('button[data-testid="download-without-license"]');
        await page.click('button[data-testid="download-without-license"]');

        await page.setRequestInterception(true);
        page.on('request', async request => {
            const requestUrl = request.url();
            console.log(requestUrl);
            if (requestUrl.indexOf('download') > -1 && !responseSent) {
                if (!requestUrl.includes('download_and_license') && !requestUrl.includes('facebook')) {
                    console.log('Download URL: ' + requestUrl);
                    res.json({
                        status: true,
                        message: 'Download success',
                        url: requestUrl
                    });
                    responseSent = true;
                    clearTimeout(timeout);
                    await browser.close();
                }
            }
        });

    } catch (error) {
        if (!responseSent) {
            res.json({
                status: false,
                message: 'Download failed'
            });
            responseSent = true;
            clearTimeout(timeout);
            await browser.close();
        }
    }
};

const downloadData = async (req, res) => {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox"]
    });
    const page = await browser.newPage();
    try {
        const cookiesString = fs.readFileSync('cookies.json');
        const cookies = JSON.parse(cookiesString);
        await page.setCookie(...cookies);

        await page.setRequestInterception(true);
        page.on('request', interceptedRequest => {
            if (
                interceptedRequest.url().endsWith('.png') ||
                interceptedRequest.url().endsWith('.jpg')
            ) {
                interceptedRequest.abort();
            } else {
                if (interceptedRequest.url().includes('infrastructure_availability')) {
                    res.json({
                        status: true,
                        message: 'Data success',
                        data: interceptedRequest.headers()
                    });
                    interceptedRequest.continue();
                } else {
                    interceptedRequest.continue();
                }
            }
        });

        await page.goto('https://elements.envato.com/');
        await page.waitForSelector('button[aria-label="Open search"]');
        await page.click('button[aria-label="Open search"]');

        res.json({
            status: true,
            message: 'Download success'
        });
    } catch (error) {
        console.log(error);
    } finally {
        await browser.close();
    }
};

const Home = (req, res) => {
    res.send('Running...');
};

export default class Controller {
    static Home = Home;
    static login = login;
    static download = download;
    static download_data = downloadData;
}
