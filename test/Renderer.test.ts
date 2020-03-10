import Renderer from "../src/Renderer";

describe("Test the Renderer", () => {
    test("It should be constructable", async (done) => {
        const renderer = new Renderer({maxConcurrency: 2});
        try {
            await renderer.close();
        } catch (e) {

        }
        done();
    });

    test("It should be closable", async (done) => {
        const renderer = new Renderer({maxConcurrency: 1});
        await renderer.close();
        done();
    });

    test("It should be able to take one screenshot without errors", async (done) => {
        const renderer = new Renderer({maxConcurrency: 1});
        await renderer.takeScreenshot({
            url: 'http://twitter.com',
            type: 'png',
            quality: 0,
            width: 1920,
            height: 1080,
            fullPage: false,
            timeout: 20_000,
            wait: 200,
            waitUntil: 'networkidle2'
        });
        await renderer.close();
        done();
    });
});
