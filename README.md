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

## Test and Deploy

### Deploy as Docker container

``` sh
# Spin up the stack
docker compose up -d

# Stop the stack
docker compose down
```

### Build to deploy as Python wheel

``` sh
# build package wheel
poetry build --format wheel

# install into your env
pip install bqat_gui-*.whl

# run the app
bqat-gui
```

## Authors and acknowledgment

__TODO__

## License

__TODO__

## Project status

__TODO__
