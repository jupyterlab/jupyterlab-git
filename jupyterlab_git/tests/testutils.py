"""Helpers for tests"""


class FakeContentManager:

    def __init__(self, root_dir):
        self.root_dir = root_dir
    
    def get(path=None):
        return {"content": ""}
