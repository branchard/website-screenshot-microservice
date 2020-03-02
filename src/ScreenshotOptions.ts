import type * as puppeteer from 'puppeteer-core';
import type {URL} from 'url';

type Complete<T> = {
    [K in keyof T]-?: T[K];
}

type ScreenshotOptions = {
    url: URL
    type?: 'png' | 'jpeg'
    quality?: number
    width?: number
    height?: number
    fullPage?: boolean
    timeout?: number // ms
    wait?: number // wait before screenshot ms
    waitUntil?: puppeteer.LoadEvent
}

type ScreenshotOptionsComplete = Complete<ScreenshotOptions>

export {
    ScreenshotOptions,
    ScreenshotOptionsComplete
};

