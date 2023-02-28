import json
from unittest.mock import patch
import os
import pytest
import tornado

from jupyterlab_git.git import Git
from jupyterlab_git.handlers import NAMESPACE
from .testutils import assert_http_error, maybe_future
