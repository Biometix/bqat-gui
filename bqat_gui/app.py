import gradio as gr

from bqat_gui import SERVER
from bqat_gui.utils import (
    FILE_TYPE,
    INTRO,
    check_task,
    check_upload,
    check_version,
    export_csv,
    get_output,
    submit_task,
)

VERSION = check_version()
HEADING = f"""
![logo](https://www.biometix.com/wp-content/uploads/2020/10/logo-square.png)
# Biometric Quality Assessment Tool (BQAT) - Web GUI
### Engine: _{VERSION}_
"""


with gr.Blocks() as demo:
    gr.Markdown(HEADING)
    gr.Markdown(INTRO)

    with gr.Accordion(label="Upload"):
        file_upload = gr.Files(file_count="multiple", file_types=FILE_TYPE)
    with gr.Accordion(label="Preview", open=False):
        file_display = gr.Gallery().style(preview=True)

    file_mode = gr.Dropdown(
        [
            "Face",
            "Fingerprint",
            "Iris",
            # "Speech",
        ],
        value="Face",
        label="Modality",
    )

    submit_btn = gr.Button("Submit")

    task_id = gr.Textbox(label="Task ID")
    check_btn = gr.Button("Check Status")

    task_status = gr.Markdown(label="Task Status")

    dataset_id = gr.Textbox(label="Collection ID")
    retrieve_btn = gr.Button("Retrieve Results")

    with gr.Accordion(label="Results"):
        task_output = gr.Dataframe(interactive=False)
    export_btn = gr.Button("Export")
    csv = gr.File(interactive=False, visible=False)

    file_upload.upload(
        fn=check_upload,
        inputs=file_upload,
        outputs=file_display,
        scroll_to_output=True,
    )
    submit_btn.click(
        fn=submit_task,
        inputs=[file_upload, file_mode],
        outputs=task_id,
    )
    check_btn.click(
        fn=check_task,
        inputs=task_id,
        outputs=[task_status, dataset_id],
    )
    retrieve_btn.click(
        fn=get_output,
        inputs=dataset_id,
        outputs=task_output,
    )
    export_btn.click(
        fn=export_csv,
        inputs=task_output,
        outputs=csv,
    )


def run():
    demo.launch(server_name=SERVER)
