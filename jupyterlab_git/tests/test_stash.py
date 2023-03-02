# Create a simple test that checks that GitStashHandler can call git.stash

import json


# Create a simple test that checks that GitStashHandler can call git.stash
# with the correct arguments and that the response is correct.
#
# The test should be similar to the one in test_remote.py

from unittest.mock import AsyncMock
from unittest.mock import patch
import pytest
import tornado

from jupyterlab_git.git import Git
from jupyterlab_git.handlers import NAMESPACE
from .testutils import assert_http_error, maybe_future


@patch("jupyterlab_git.git.execute")
async def test_git_stash(mock_execute, jp_fetch, jp_root_dir):
    # Given
    # Creates a temporary directory created by pytest's tmp_path fixture and concatenates the string "test_path" to it.
    local_path = jp_root_dir / "test_path"
    # Replaces the real execute function with a mock function
    mock_execute.return_value = maybe_future((0, "", ""))
    # When
    #

    # jp_fetch is a fixture that returns a function that can be used to make HTTP requests to the Jupyter server.
    """
    jp_fetch(
        NAMESPACE, # NAMESPACE is the prefix of the url
        local_path.name, # local_path.name is the name of the folder
        "stash", # stash is the name of the handler
        body, # 
        method="POST", # method is the http method
    )
    """
    response = await jp_fetch(
        NAMESPACE,
        local_path.name,
        "stash",
        body=json.dumps({}),
        method="POST",
    )
    # Then
    command = ["git", "stash"]

    assert response.code == 201
    # json.loads is a function that returns a json encoded string
    payload = json.loads(response.body)
    assert payload == {
        "code": 0,
        "command": " ".join(command),
    }
