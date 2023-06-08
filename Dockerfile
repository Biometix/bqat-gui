# syntax=docker/dockerfile:1

FROM python:3.11

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=off

COPY requirements.txt /app

RUN python -m pip install --upgrade pip && \
    python -m pip install -r requirements.txt

COPY bqat_gui ./bqat_gui

# RUN useradd bqatisan
# RUN chown -R bqatisan /app
# USER bqatisan

CMD [ "python", "-m", "bqat_gui" ]
