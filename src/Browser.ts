import * as puppeteer from 'puppeteer-core';
import {promisify} from 'util';
// @ts-ignore
// import * as ps from 'ps-node-promise-es6';
import type {ScreenshotOptionsComplete} from "./ScreenshotOptions";

const sleep = promisify(setTimeout);

export default class Browser {
    private puppeteerBrowserPromise: Promise<puppeteer.Browser> | null = null;
    private pendingScreenshotPromise: Promise<Buffer> | null = null;
    private screenshotStatus: 'available' | 'pending' = 'available';
    private timeoutId: NodeJS.Timeout | null = null;
    private browserKillingPending: boolean = false;

    constructor(private options: { timeout: number, id: number }) {
    }

    public async takeScreenshot(options: ScreenshotOptionsComplete): Promise<Buffer> {
        console.debug(`Take a new screenshot, id: ${this.options.id}`, options);
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
                console.debug(`Screenshot done, id: ${this.options.id}`);
            } catch (e) {
                reject(e);
            }
        });

        return this.pendingScreenshotPromise;
    }

    public isAvailableForScreenshot(): boolean {
        return this.screenshotStatus === 'available';
    }

    public async awaitForScreenshot(): Promise<this> {
        if (this.screenshotStatus === 'available') {
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
                    args: [
                        '--headless',
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-web-security',
                        '--disable-dev-profile',
                        '--disable-dev-shm-usage',
                        '--disable-gpu']
                }, {})
            );
        }

        const browser: puppeteer.Browser = await this.puppeteerBrowserPromise;

        browser.on('disconnected', () => {
            console.log(`Browser with id: ${this.options.id} disconnected`)
            this.killTheBrowser();
        });

        this.resetTimeout();
        return this.puppeteerBrowserPromise;
    }

    private resetTimeout() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        this.timeoutId = setTimeout(() => {
            console.debug(`Browser with id: ${this.options.id} timed out`);
            this.killTheBrowser();
        }, this.options.timeout)
    }

    private async killTheBrowser(): Promise<void> {
        // do not kill the browser if a rendering is pending
        if (this.screenshotStatus === 'pending') {
            if (this.timeoutId) {
                this.resetTimeout();
            }
            return;
        }

        if(!this.browserKillingPending){
            this.browserKillingPending = true;
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
            }
            this.timeoutId = null;

            if (this.puppeteerBrowserPromise) {
                const browser: puppeteer.Browser = await this.puppeteerBrowserPromise;

                await (await this.puppeteerBrowserPromise).close();
                this.puppeteerBrowserPromise = null;
            }

            // setTimeout(async () => {
            //     // after closing the browser it can still some zombies processes
            //     const psLookup = await ps.lookup({});
            //
            //     console.debug(psLookup);
            //     for (let proc of psLookup) {
            //         if (proc.command === '[chrome]') {
            //             console.debug(`Killing the PID ${proc.pid}`);
            //             await ps.kill(proc.pid, 'SIGKILL');
            //         }
            //     }
            // }, 1000);

            this.browserKillingPending = false;
        }
    }
}
