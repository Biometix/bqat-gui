
# Biometric Quality Assessment Tool (BQAT)

BQAT is a biometric quality assessment tool for generating and analysing biometric sample quality to international standards and supporting customized metrics. It takes as input directory of biometric images/data in standard formats (e.g. wsq,png,jpg) and output both the raw quality information as well as an analysis report.

## bqat-gui

This project provides a simple Web GUI for BQAT-API functionalities.

## Getting started

Make sure you have `BQAT-API` running.

``` sh
# setup python env
poetry install

# activate the env
poetry shell

# start the app
python -m bqat_gui
```

Find the GUI at `localhost:7860`.


## Development

### Web

``` sh
# To start dev server
cd bqat_gui
npm install
npm run dev
```

### Desktop

``` sh
# To start dev server
cd desktop
npm install
npm run dev

### Deploy as Docker container

``` sh
# Spin up the stack
cd bqat_gui
docker compose up -d

# Stop the stack
docker compose down
```
## Test and Deploy

### Build to deploy as Python wheel

``` sh
# build package wheel
poetry build --format wheel

# install into your env
pip install bqat_gui-*.whl

# run the app
bqat-gui
```
### Build the binary for desktop application.

``` sh
cd desktop
npm install

# Build executable for Windows (exe)
npm run build-win

# Build executable for Linux (AppImage)
npm run build-linux

# Build executable for macOS (dmg)
npm i dmg-license # keep in mind this should not be committed because its an Mac only dependency
npm run build-mac
```
## Note
- Note: OFIQ retrive data only from top level of input folder

- The generated html page alt text is not right(Speech)

## Authors and acknowledgment

__TODO__

## License

__TODO__

## Project status

__TODO__
