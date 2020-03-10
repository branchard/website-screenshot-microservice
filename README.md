# Website screenshot microservice
The simplest way to take screenshots of websites with a [Docker](https://www.docker.com/) container.

Based on [Puppeteer](https://pptr.dev/) and 
[Puppeteer Cluster](https://github.com/thomasdondorf/puppeteer-cluster), 
this service allow you to take several screenshots concurrently.

## Requirements
Docker cli.

## Getting Started
### Run the docker image
`docker run --rm --name screenshot-microservice --env MAX_CONCURRENCY=2 -p 1082:3000 branchard/website-screenshot-microservice:latest`
### Get the screenshot of a website
http://localhost:1082/?url=http%3A%2F%2Ftwitter.com&type=png&width=1920&height=1080

## API
| Name            | Allowed values                                               | Default | Description                                                                                                                             |Example usage                                                                             |
|-----------------|:------------------------------------------------------------:|:-------:|-----------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|
|`url` (required) | any url                                                      |         | Target URL (URL encoded)                                                                                                                |`http://localhost:1082/?url=http%3A%2F%2Ftwitter.com`                                     |
|`type`           |`png` or `jpg`                                                | `jpeg`  | The type of the screenshot                                                                                                              |`http://localhost:1082/?url=http%3A%2F%2Ftwitter.com&type=png`                            |
|`quality`        | a number between 0 and 100                                   | `85`    | The quality of the screenshot (not allowed withe type png)                                                                              |`http://localhost:1082/?url=http%3A%2F%2Ftwitter.com&type=jpg&quality=85`                 |
|`width`          | a number                                                     | `800`   | The width of the viewport                                                                                                               |`http://localhost:1082/?url=http%3A%2F%2Ftwitter.com&type=jpg&width=1920`                 |
|`height`         | a number                                                     | `600`   | The height of the viewport                                                                                                              |`http://localhost:1082/?url=http%3A%2F%2Ftwitter.com&type=jpg&height=1080`                |
|`fullPage`       | a boolean                                                    | `false` | When true, takes a screenshot of the full scrollable page                                                                               |`http://localhost:1082/?url=http%3A%2F%2Ftwitter.com&type=jpg&fullpage=true`              |
|`timeout`        | a number                                                     | `20000` | The number of millisecond before the screenshot timeout                                                                                 |`http://localhost:1082/?url=http%3A%2F%2Ftwitter.com&type=jpg&timeout=10000`              |
|`wait`           | a number                                                     | `2000`  | The number of millisecond to wait before taking the screenshot (useful to be sure a page is fully rendered, and all animation are done) |`http://localhost:1082/?url=http%3A%2F%2Ftwitter.com&type=jpg&wait=200`                   |
|`waitUntil`      | `load`, `domcontentloaded`, `networkidle0` or `networkidle2` | `load`  | When to consider the screenshot can be taken (the wait time occur after this one)                                                       |`http://localhost:1082/?url=http%3A%2F%2Ftwitter.com&type=jpg&waitUntil=domcontentloaded` |
