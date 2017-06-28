from hi.handlers import setup_handlers
# Jupyter Extension points
def _jupyter_server_extension_paths():
    return [{
        'module': 'hi',
    }]

def _jupyter_nbextension_paths():
    return [{
        "section": "notebook",
        "dest": "hi",
        "src": "static",
        "require": "hi/one"
    }]

def load_jupyter_server_extension(nbapp):
    setup_handlers(nbapp.web_app)
