import * as puppeteer from 'puppeteer-core';
import {promisify} from 'util';
import type {ScreenshotOptionsComplete} from "./ScreenshotOptions";

const sleep = promisify(setTimeout);

export default class Browser {
    private puppeteerBrowserPromise: Promise<puppeteer.Browser> | null = null;
    private pendingScreenshotPromise: Promise<Buffer> | null = null;
    private screenshotStatus: 'available' | 'pending' = 'available';
    private timeoutId: NodeJS.Timeout | null = null;

    constructor(private options: { timeout: number }) {
    }

    public async takeScreenshot(options: ScreenshotOptionsComplete): Promise<Buffer> {
        // awaiting for the previous screenshot
        if (this.screenshotStatus === 'pending') {
            throw new Error('A Browser instance cannot take multiple screenshots simultaneously');
        }

        this.screenshotStatus = 'pending';
        this.pendingScreenshotPromise = new Promise<Buffer>(async (resolve, reject) => {
            try {
                const browser: puppeteer.Browser = await this.getBrowser();
                const page = await browser.newPage();

                await page.goto(options.url.toString(), {
                    timeout: options.timeout,
                    waitUntil: options.waitUntil,
                });

                await page.setViewport({
                    width: options.width,
                    height: options.height,
                });

                // wait 2 sec to be sur the website is fully rendered
                await sleep(options.wait);

                const buffer: Buffer = await page.screenshot({
                    type: options.type,
                    quality: options.quality,
                    fullPage: options.fullPage
                });
                resolve(buffer);
                this.screenshotStatus = 'available';
            } catch (e) {
                reject(e);
            }
        });

        return this.pendingScreenshotPromise;
    }

    public async awaitForScreenshot(): Promise<this> {
        if (this.pendingScreenshotPromise === null) {
            return this;
        }

        await this.pendingScreenshotPromise;
        return this;
    }

    private async getBrowser(): Promise<puppeteer.Browser> {
        if (!this.puppeteerBrowserPromise) {
            this.puppeteerBrowserPromise = puppeteer.launch(
                Object.assign({
                    executablePath: 'chromium-browser',
                    args: ['--headless', '--no-sandbox', '--disable-setuid-sandbox']
                }, {})
            );
        }

        await this.puppeteerBrowserPromise;
        this.resetTimeout();
        return this.puppeteerBrowserPromise;
    }

    private resetTimeout() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        this.timeoutId = setTimeout(async () => {
            this.timeoutId = null;
            if (this.puppeteerBrowserPromise) {
                // do not close the browser if a rendering is pending
                if(this.screenshotStatus === 'pending'){
                    this.resetTimeout();
                    return;
                }
                (await this.puppeteerBrowserPromise).close();
            }
        }, this.options.timeout)
    }
}
