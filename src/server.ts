import {get as getApp} from './app';

const PORT: number = Number(process.env.PORT || 3000);

const app = getApp();

const server = app.expressApp.listen(PORT, () => {
    console.info(`Listen port on ${PORT}.`);
});

// Terminate process
process.on('SIGINT', async () => {
    try {
        await app.close();
        server.close((err) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            console.info('Bye.');
            process.exit(0);
        });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
});
