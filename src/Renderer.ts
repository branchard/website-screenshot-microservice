import {Cluster} from 'puppeteer-cluster';
import {ScreenshotOptionsComplete} from "./ScreenshotOptions";
import * as puppeteer from 'puppeteer-core';
import {promisify} from 'util';

const sleep = promisify(setTimeout);

export default class Renderer {
    private static DEFAULT_MAX_CONCURRENCY: number = 4;
    private readonly clusterCreationPromise: Promise<Cluster<ScreenshotOptionsComplete, Buffer>>;

    constructor(options: { maxConcurrency?: number }) {
        const maxConcurrency = options.maxConcurrency || Renderer.DEFAULT_MAX_CONCURRENCY;

        console.info('New renderer', {
            maxConcurrency
        });

        this.clusterCreationPromise = new Promise(async (resolve, reject) => {
            try {
                const cluster: Cluster<ScreenshotOptionsComplete, Buffer> = await Cluster.launch({
                    concurrency: Cluster.CONCURRENCY_CONTEXT,
                    maxConcurrency: maxConcurrency,
                    timeout: 60000,
                    skipDuplicateUrls: false,
                    puppeteer,
                    puppeteerOptions: {
                        executablePath: 'google-chrome-stable',
                        ignoreHTTPSErrors: true,
                        headless: true,
                        args: [
                            '--no-sandbox',
                            '--disable-setuid-sandbox',
                            '--purge_hint_cache_store', // Purges the hint cache store on startup, so that it's guaranteed to be using fresh data.
                            // '--disable-web-security', // Don't enforce the same-origin policy.
                            '--disable-dev-shm-usage', // The /dev/shm partition is too small in certain VM environments, causing Chrome to fail or crash (see http://crbug.com/715363). Use this flag to work-around this issue (a temporary directory will always be used to create anonymous shared memory files).
                            '--disable-dinosaur-easter-egg',
                            '--disable-auto-reload', // Disable auto-reload of error pages.
                            '--disable-gpu', // Disables GPU hardware acceleration. If software renderer is not in place, then the GPU process won't launch.
                            '--no-zygote', // Disables the use of a zygote process for forking child processes. Instead, child processes will be forked and exec'd directly. Note that --no-sandbox should also be used together with this flag because the sandbox needs the zygote to work.
                            // '--allow-insecure-localhost', // Enables TLS/SSL errors on localhost to be ignored (no interstitial, no blocking of requests).
                            // '--allow-loopback-in-peer-connection', // Allows loopback interface to be added in network list for peer connection.
                            // '--disable-background-networking',
                            '--disable-default-apps',
                            '--disable-extensions',
                            '--disable-sync',
                            '--disable-translate',
                            '--hide-scrollbars',
                            // '--metrics-recording-only',
                            '--mute-audio',
                            '--no-first-run',
                            // '--safebrowsing-disable-auto-update',
                            // '--ignore-certificate-errors',
                            // '--ignore-ssl-errors',
                            // '--ignore-certificate-errors-spki-list',
                            '--user-data-dir=/tmp',
                            '--disable-software-rasterizer'
                        ]
                    },
                });

                await cluster.task(async ({page, data: options}: { page: puppeteer.Page, data: ScreenshotOptionsComplete }) => {
                    console.log('New screenshot task: ', options);

                    await page.goto(options.url, {
                        timeout: options.timeout,
                        waitUntil: options.waitUntil,
                    });

                    await page.setViewport({
                        width: options.width,
                        height: options.height,
                    });

                    // wait n sec to be sur the website is fully rendered
                    await sleep(options.wait);

                    const buffer: Buffer = await page.screenshot({
                        type: options.type,
                        quality: options.quality,
                        fullPage: options.fullPage,
                    });

                    await page.close();

                    console.log('Screenshot done.');
                    return buffer;
                });

                resolve(cluster);
            } catch (e) {
                reject(`Unable to create the renderer cluster.\n${JSON.stringify(e)}`);
            }
        });
    }

    public async takeScreenshot(options: ScreenshotOptionsComplete): Promise<Buffer> {
        try {
            const cluster = await this.clusterCreationPromise;
            return await cluster.execute(options);
        } catch (e) {
            throw e;
        }
    }
}
