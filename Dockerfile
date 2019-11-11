FROM node:10-alpine

COPY . .

RUN npm i -g phonegap cordova

RUN phonegap platform add browser

ENTRYPOINT [ "phonegap" ]

CMD [ "run browser" ]
