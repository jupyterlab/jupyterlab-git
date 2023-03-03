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
import os
from jupyterlab_git.git import Git
from jupyterlab_git.handlers import NAMESPACE
from .testutils import assert_http_error, maybe_future


@patch("jupyterlab_git.git.execute")
async def test_git_stash(mock_execute, jp_fetch, jp_root_dir):
    # Given
    # Creates a temporary directory created by pytest's tmp_path fixture and concatenates the string "test_path" to it.
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"

    local_path = jp_root_dir / "test_path"
    # 0 = success code, "" = no output, "" = no error
    mock_execute.return_value = maybe_future((0, "", ""))
    # When
    #

    # jp_fetch is a fixture that returns a function that can be used to make HTTP requests to the Jupyter server.
    """
    jp_fetch(
        NAMESPACE, # NAMESPACE is the prefix of the url
        local_path.name, # local_path.name is the name of the folder
        "stash", # stash is the name of the handler
        body, empty because git stash doesn't take any arguments
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
    # Checks that the mock function was called with the correct arguments
    mock_execute.assert_called_once_with(command, cwd=str(local_path), env=env)

    assert response.code == 200
    # json.loads turns a string into a dictionary
    payload = json.loads(response.body)
    assert payload == {
        "code": 0,
        "message": "",
        "command": " ".join(command),
    }


# git stash when there are no changes

# git stash when there are changes

# git stash when there are changes and a message
