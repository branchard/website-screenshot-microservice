import * as express from 'express';
import * as qs from 'qs';
import {URL} from 'url';
import Renderer from './Renderer';
import type {ScreenshotOptions, ScreenshotOptionsComplete} from "./ScreenshotOptions";

const PORT: number = Number(process.env.PORT || 3000);

const app: express.Express = express();

const renderer: Renderer = new Renderer({
    maxSimultaneousBrowsers: process.env.MAX_SIMULTANEOUS_BROWSERS ? Number(process.env.MAX_SIMULTANEOUS_BROWSERS) : undefined,
    browserTimeout: process.env.BROWSER_TIMEOUT ? Number(process.env.BROWSER_TIMEOUT) : undefined
});

// Configure.
app.set('query parser', (s: any) => qs.parse(s, {allowDots: true}));
app.disable('x-powered-by');

// Render url.
app.use(async (req, res, next) => {
    console.info('New query', req.query);

    try {
        if (!req.query.url || typeof req.query.url !== 'string') {
            throw new Error('You must define an url');
        }

        const options: ScreenshotOptions = {
            url: new URL(req.query.url)
        };

        if (req.query.type) {
            if (req.query.type !== 'png' && req.query.type !== 'jpeg') {
                throw new Error('The type must be jpeg or png');
            }

            options['type'] = req.query.type;
        }

        if (req.query.quality || req.query.quality === 0) {
            const quality = Number(req.query.quality);

            if (quality < 0 || quality > 100) {
                throw new Error('The quality must be set between 0 and 100');
            }

            options['quality'] = Number(req.query.quality);
        }

        if (req.query.width || req.query.width === 0) {
            if (req.query.width < 0) {
                throw new Error('The width cannot be under 0');
            }

            options['width'] = Number(req.query.width);
        }

        if (req.query.height || req.query.height === 0) {
            if (req.query.height < 0) {
                throw new Error('The height cannot be under 0');
            }

            options['height'] = Number(req.query.height);
        }

        if (req.query.fullPage) {
            options['fullPage'] = true;
        }

        if (req.query.timeout) {
            options['timeout'] = Number(req.query.timeout);
        }

        if (req.query.wait) {
            options['wait'] = Number(req.query.wait);
        }

        if (req.query.waitUntil) {
            if (req.query.waitUntil !== 'load' &&
                req.query.waitUntil !== 'domcontentloaded' &&
                req.query.waitUntil !== 'networkidle0' &&
                req.query.waitUntil !== 'networkidle2'
            ) {
                throw new Error('The waitUntil must be load, domcontentloaded, networkidle0 or networkidle2');
            }

            options['waitUntil'] = req.query.waitUntil;
        }

        const screenshotOptions: ScreenshotOptionsComplete = Object.assign({
            type: 'jpeg',
            quality: 85,
            width: 800,
            height: 600,
            fullPage: false,
            timeout: 20_000, // ms
            wait: 2_000, // wait before screenshot ms
            waitUntil: 'load'
        }, options);

        const buffer: Buffer = await renderer.takeScreenshot(screenshotOptions);

        res.set({
            'Content-Type': `image/jpeg`,
            'Content-Length': buffer.length,
        }).send(buffer);
    } catch (e) {
        next(e);
    }
});

// Error page.
app.use((err: Error, req: any, res: any, next: any) => { // i'm too lazy
    console.error(err);
    res.status(500).send('Oops, An expected error seems to have occurred. <br>' + err.message);
});

app.listen(PORT, () => {
    console.info(`Listen port on ${PORT}.`);
});

// Terminate process
process.on('SIGINT', () => {
    console.info('Bye.');
    process.exit(0);
});
