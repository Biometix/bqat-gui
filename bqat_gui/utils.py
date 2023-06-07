import atexit
import platform
import sys
import tempfile
from pathlib import Path

import gradio as gr
import pandas as pd
import requests
from PIL import Image

from bqat_gui import BQAT_API

FILE_TYPE = [".jpg", ".jpeg", ".png", ".wsq", ".bmp", ".jp2"]
INTRO = """
1. Click the file widget to upload or drag in files;
2. Select modality of the samples;
3. Click `Submit` to send the task and you will get the `Task ID` below;
4. Click `Check` to check if the task was finished;
5. Click `Retrieve` to get results if you got the `Collection ID`;
6. Click `Export` to generate downloadable CSV.
"""
TEMP = (
    tempfile.NamedTemporaryFile(
        prefix="results_",
        suffix=".csv",
    )
    if platform.system() != "Windows"
    else Path("temp/results.csv")
)


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
        if Path(file.name).suffix in FILE_TYPE:
            image_list.append(Image.open(file.name))
    return image_list


def check_version():
    r = requests.get(f"http://{BQAT_API}/scan/info")
    if r.status_code == 200:
        return r.json()["version"]
    else:
        print(f"Failed to start, BQAT-API ({BQAT_API}) not accessible.")
        sys.exit()


def export_csv(df):
    if platform.system() == "Windows":
        if not TEMP.parent.exists():
            TEMP.parent.mkdir(parents=True)
        path = TEMP
    else:
        path = TEMP.name
    atexit.register(clean_up, TEMP)
    df.to_csv(TEMP, index=False)
    return gr.File.update(path, visible=True)


def clean_up(temp_file):
    Path(temp_file).unlink(missing_ok=True)
    Path(temp_file).parent.rmdir()
