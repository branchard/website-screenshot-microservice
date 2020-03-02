import Browser from "./Browser";
import type {ScreenshotOptionsComplete} from "./ScreenshotOptions";

export default class Renderer {
    private static DEFAULT_MAX_SIMULTANEOUS_BROWSERS: number = 4;
    private static DEFAULT_BROWSER_TIMEOUT: number = 60_000; // the time before an IDLE browser is destroyed
    private readonly maxSimultaneousBrowsers: number;
    private readonly browserTimeout: number;
    private readonly browsers: Browser[] = [];

    constructor({maxSimultaneousBrowsers, browserTimeout}: { maxSimultaneousBrowsers?: number, browserTimeout?: number }) {
        this.maxSimultaneousBrowsers = maxSimultaneousBrowsers || Renderer.DEFAULT_MAX_SIMULTANEOUS_BROWSERS;
        this.browserTimeout = browserTimeout || Renderer.DEFAULT_BROWSER_TIMEOUT;

        console.info('New renderer', {
            maxSimultaneousBrowsers: this.maxSimultaneousBrowsers,
            browserTimeout: this.browserTimeout
        })
    }

    public async takeScreenshot(options: ScreenshotOptionsComplete): Promise<Buffer> {
        try {
            const availableBrowser: Browser = await this.getOneAvailableBrowser();
            return await availableBrowser.takeScreenshot(options);
        } catch (e) {
            throw e;
        }
    }

    private async getOneAvailableBrowser(options = {}): Promise<Browser> {
        if (this.browsers.length > this.maxSimultaneousBrowsers) {
            throw new Error(`There is more browser than max simultaneous browsers (${this.browsers.length}.${this.maxSimultaneousBrowsers})`);
        }

        // check if at least one browser is available for screenshot
        for (const browser of this.browsers) {
            if(browser.isAvailableForScreenshot()){
                return browser;
            }
        }

        // else spawn a new browser if possible
        if (this.browsers.length < this.maxSimultaneousBrowsers) {
            const id = Math.floor(Math.random() * 100) + 1;
            console.debug(`Create a new Browser instance with id: ${id}`);
            const newBrowser = new Browser({timeout: this.browserTimeout, id});
            this.browsers.push(newBrowser);
            return newBrowser;
        }

        // else wait for an available browser
        const browserWaiters: Promise<Browser>[] = [];

        for (const browser of this.browsers) {
            browserWaiters.push(browser.awaitForScreenshot());
        }

        return await Promise.race(browserWaiters);
    }
}
