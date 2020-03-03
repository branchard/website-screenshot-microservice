FROM node:12.16.1-alpine

LABEL maintainer="benoit.branchard@gmail.com"

## See https://crbug.com/795759
#RUN apt-get update && apt-get install -yq libgconf-2-4
#
#ENV APT_KEY_DONT_WARN_ON_DANGEROUS_USAGE=1

# Adding edge repo
RUN echo @edge http://nl.alpinelinux.org/alpine/edge/community > /etc/apk/repositories \
    && echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories

# Installs needed packages
RUN apk add --no-cache \
    iputils@edge \
    libmagic@edge \
    nano@edge

# Installs latest Chromium package
RUN apk add --no-cache \
    libstdc++@edge \
    chromium@edge \
    harfbuzz@edge \
    nss@edge \
    freetype@edge \
    ttf-freefont@edge \
    && rm -rf /var/cache/* \
    && mkdir /var/cache/apk

# skip the chromium download when installing puppeteer
# launch puppeteer with: browser.launch({executablePath: 'google-chrome-unstable'})
#ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN mkdir app

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
COPY tsconfig.json /app/tsconfig.json
COPY LICENSE /app/LICENSE
COPY src /app/src

# Install puppeteer so it's available in the container.
RUN cd /app && npm install --quiet
RUN cd /app && npm run build

WORKDIR /app

EXPOSE 3000

#ENV MAX_CONCURRENCY=4

CMD npm run start

# chromium-browser

# Add puppeteer user (pptruser).
#RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
#    && mkdir -p /home/pptruser/Downloads \
#    && chown -R pptruser:pptruser /home/pptruser \
#    && chown -R pptruser:pptruser /node_modules
#
## Run user as non privileged.
#USER pptruser
#
#CMD ["google-chrome-stable"]
