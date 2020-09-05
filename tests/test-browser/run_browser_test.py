# -*- coding: utf-8 -*-
# This file reproduces https://github.com/jupyterlab/jupyterlab/blob/master/jupyterlab/browser_check.py
# but patch the global `here` to use the local chrome-test.js
import os
from unittest.mock import patch

from jupyterlab.browser_check import BrowserApp

here = os.path.abspath(os.path.dirname(__file__))


if __name__ == "__main__":
    with patch("jupyterlab.browser_check.here", here):
        BrowserApp.launch_instance()
