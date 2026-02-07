FROM node:hydrogen-slim AS build_image
WORKDIR /app/react-app

COPY package.json .

RUN npm install

COPY . .

RUN npm run build

FROM node:hydrogen-slim AS production_image
WORKDIR /app/react-app

COPY --from=build_image /app/react-app/dist/ /app/react-app/dist/

COPY package.json .
COPY vite.config.js .

RUN npm install vite

CMD ["npm", "run", "preview"]