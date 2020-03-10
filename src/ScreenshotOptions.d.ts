import type * as puppeteer from 'puppeteer-core';

type Complete<T> = {
    [K in keyof T]-?: T[K];
}

type ScreenshotOptions = {
    url: string
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

