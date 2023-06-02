import tempfile
from pathlib import Path

import gradio as gr
import pandas as pd
import requests
from PIL import Image

from bqat_gui import BQAT_API

FILE_TYPE = (".jpg", ".jpeg", ".png", ".wsq", ".bmp", ".jp2")
TEMP = tempfile.NamedTemporaryFile(prefix="results_", suffix=".csv")


def submit_task(samples, modality):
    payloads = []
    for sample in samples:
        payloads.append(
            (
                "files",
                (Path(sample.name).name, open(sample.name, "rb")),
            )
        )

    r = requests.post(
        f"http://{BQAT_API}/scan/uploaded?modality={modality.casefold()}",
        files=payloads,
    ).json()
    return r["tid"]


def check_task(task_id):
    r = requests.get(f"http://{BQAT_API}/task/{task_id}/").json()
    match r["status"]:
        case 0:
            status = "__Pending...__"
        case 1:
            status = "__Processing...__"
        case 2:
            status = "__Finished.__"
    collection = r.get("collection")
    return status, collection


def get_output(dataset_id):
    r = requests.get(f"http://{BQAT_API}/scan/{dataset_id}/profiles").json()
    df = pd.DataFrame(r)
    return df


def check_upload(files):
    image_list = []
    for file in files:
        if Path(file.name).suffix in (".jpg"):
            image_list.append(Image.open(file.name))
    return image_list


def check_version():
    r = requests.get(f"http://{BQAT_API}/scan/info")
    body = r.json()
    return body["version"]


def export_csv(df):
    df.to_csv(TEMP, index=False)
    return gr.File.update(value=TEMP.name, visible=True)
