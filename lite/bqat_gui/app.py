import gradio as gr

from bqat_gui import SERVER, TITLE
from bqat_gui.utils import (
    FILE_TYPE,
    check_task,
    check_upload,
    clear_task,
    export_csv,
    get_footnote,
    get_heading,
    get_intro,
    get_output,
    submit_task,
)

with gr.Blocks(title=TITLE) as demo:
    gr.Markdown(get_heading())
    gr.Markdown("---")
    gr.Markdown(get_intro())
    gr.Markdown("---")

    with gr.Accordion(label="Upload"):
        file_upload = gr.Files(file_count="multiple", file_types=FILE_TYPE)
    with gr.Accordion(label="Preview", open=False):
        file_display = gr.Gallery(preview=True)

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

    gr.Markdown("---")

    task_id = gr.Textbox(label="Task ID")
    check_btn = gr.Button("Check Status")

    task_status = gr.Textbox(
        label="Task Status",
        interactive=False,
        # info="You can `Retrieve Results` when it was finished.",
    )

    with gr.Accordion(label="Output ID", open=False):
        dataset_id = gr.Textbox(label="Collection")

    gr.Markdown("---")

    retrieve_btn = gr.Button("Get Output")

    task_output = gr.Dataframe(interactive=False)
    csv = gr.File(interactive=False, visible=False)
    with gr.Row():
        export_btn = gr.Button("Export")
        clear_btn = gr.ClearButton(
            components=[
                file_upload,
                file_display,
                file_mode,
                task_status,
                task_id,
                dataset_id,
                task_output,
                csv,
            ],
        )
    # info_box = gr.Markdown()

    doc_link = gr.Markdown(
        """Find info about the output at: [biometix.github.io](https://biometix.github.io/getting_started/getting_started.html)
"""
    )

    gr.Markdown("---")
    gr.Markdown(get_footnote())

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
        scroll_to_output=True,
    )
    clear_btn.click(
        fn=clear_task,
        inputs=dataset_id,
        # outputs=info_box,
    )
    export_btn.click(
        fn=export_csv,
        inputs=task_output,
        outputs=csv,
    )


def run():
    demo.launch(server_name=SERVER)
