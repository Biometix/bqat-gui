from bqat_gui import SERVER
from bqat_gui.app import demo

demo.launch(
    server_name=SERVER,
    favicon_path="favicon.png",
    show_api=False,
)
