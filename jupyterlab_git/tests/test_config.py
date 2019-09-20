import json
import subprocess

from mock import patch, call, Mock
import pytest

from jupyterlab_git.git import Git
from jupyterlab_git.handlers import GitConfigHandler


@patch("jupyterlab_git.handlers.GitConfigHandler.__init__", Mock(return_value=None))
@patch(
    "jupyterlab_git.handlers.GitConfigHandler.get_json_body",
    Mock(return_value={"path": "test_path"}),
)
@patch("jupyterlab_git.handlers.GitConfigHandler.git", Git("/bin"))
@patch("jupyterlab_git.handlers.GitConfigHandler.finish")
@patch("subprocess.Popen")
def test_git_get_config_success(popen, finish):
    # Given
    process_mock = Mock()
    attrs = {
        "communicate": Mock(
            return_value=(
                b"user.name=John Snow\nuser.email=john.snow@iscoming.com",
                b"",
            )
        ),
        "returncode": 0,
    }
    process_mock.configure_mock(**attrs)
    popen.return_value = process_mock

    # When
    GitConfigHandler().post()

    # Then
    popen.assert_called_once_with(
        ["git", "config", "--list"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd="test_path",
    )
    process_mock.communicate.assert_called_once_with()

    finish.assert_called_once_with(
        json.dumps(
            {
                "code": 0,
                "options": {
                    "user.name": "John Snow",
                    "user.email": "john.snow@iscoming.com",
                },
            }
        )
    )


@patch("jupyterlab_git.handlers.GitConfigHandler.__init__", Mock(return_value=None))
@patch(
    "jupyterlab_git.handlers.GitConfigHandler.get_json_body",
    Mock(
        return_value={
            "path": "test_path",
            "options": {
                "user.name": "John Snow",
                "user.email": "john.snow@iscoming.com",
            },
        }
    ),
)
@patch("jupyterlab_git.handlers.GitConfigHandler.git", Git("/bin"))
@patch("jupyterlab_git.handlers.GitConfigHandler.finish")
@patch("subprocess.Popen")
def test_git_set_config_success(popen, finish):
    # Given
    process_mock = Mock()
    attrs = {"communicate": Mock(return_value=(b"", b"")), "returncode": 0}
    process_mock.configure_mock(**attrs)
    popen.return_value = process_mock

    # When
    GitConfigHandler().post()

    # Then
    assert popen.call_count == 2
    assert (
        call(
            ["git", "config", "--add", "user.email", "john.snow@iscoming.com"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd="test_path",
        )
        in popen.call_args_list
    )
    assert (
        call(
            ["git", "config", "--add", "user.name", "John Snow"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd="test_path",
        )
        in popen.call_args_list
    )
    assert process_mock.communicate.call_count == 2

    finish.assert_called_once_with(json.dumps({"code": 0, "message": ""}))
