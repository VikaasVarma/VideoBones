# VideoBones

## Downloading

Stable downloads can be obtained from the Releases page [ TODO ].

## Development

Requirements: node 16.13.0+ (Download LTS from https://nodejs.org, check version with `node -v`) and npm 8.1.0+ which should be bundled

After cloning the repository, run `npm install` to install the dependencies. 

You may wish to install electron globally: `npm i -g electron` to reduce disk usage.

Run `npm run dev` to build the app and `npm start` to start the electron runtime.

## Building

Run `npm ci` to install the frozen dependencies, and `npm run build`. Appedn `:windows` `:mac` or `:linux` to build only for that platform.

## Contributing

Pull requests require at least one accepting review, and error-free passing of a lint check (no new warnings should be added), which can be run with `npm run lint` - append `:js` and `:css` to lint only that part.
Tip: use `npm run lint:fix` to fix some of the errors (watch out for extra diff)