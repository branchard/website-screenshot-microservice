import * as supertest from "supertest";
import * as superagent from "superagent";
import * as FileType from 'file-type';
import * as ImageSize from 'image-size';
import {get as getApp} from '../src/app';

describe("Test app", () => {
    test("It should response the GET method without parameters with a code 500", async (done) => {
        const app = getApp();
        const response = await supertest(app.expressApp).get("/");
        expect(response.status).toBe(500);
        await app.close();
        done();
    });

    test("It should response the GET method with incorrect parameters with a code 500", async (done) => {
        const app = getApp();
        const response = await supertest(app.expressApp).get("/?url=https%3A%2F%2Fwww.google.com&type=foo");
        expect(response.status).toBe(500);
        await app.close();
        done();
    });

    test("It should response the GET method with correct parameters with a code 200", async (done) => {
        const app = getApp();
        const response = await supertest(app.expressApp).get("/?url=http%3A%2F%2Ftwitter.com&type=png");
        expect(response.status).toBe(200);
        await app.close();
        done();
    });

    test("It should response the GET method with correct parameters with a png file of size 1920x1080", async (done) => {
        const app = getApp();
        const response = await supertest(app.expressApp)
            .get("/?url=http%3A%2F%2Ftwitter.com&type=png&width=1920&height=1080")
            .buffer(true).parse(superagent.parse.image);
        expect(response.status).toBe(200);

        // check the image type
        const buffer: Buffer = response.body;
        const type = await FileType.fromBuffer(buffer);
        expect(type?.ext).toBe('png');
        expect(type?.mime).toBe('image/png');

        // check the image dimensions
        const dimensions = ImageSize.imageSize(buffer);
        expect(dimensions.width).toBe(1920);
        expect(dimensions.height).toBe(1080);
        await app.close();
        done();
    });
});
