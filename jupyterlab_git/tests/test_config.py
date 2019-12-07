import json
import subprocess

from unittest.mock import patch, call, Mock
import pytest

from jupyterlab_git.git import Git
from jupyterlab_git.handlers import GitConfigHandler

from .testutils import FakeContentManager, ServerTest


class TestConfig(ServerTest):
    @patch("subprocess.Popen")
    def test_git_get_config_success(self, popen):
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
        body = {"path": "test_path"}
        response = self.tester.post(["config"], body=body)

        # Then
        popen.assert_called_once_with(
            ["git", "config", "--list"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd="test_path",
        )
        process_mock.communicate.assert_called_once_with()

        assert response.status_code == 201
        payload = response.json()
        assert payload == {
            "code": 0,
            "options": {
                "user.name": "John Snow",
                "user.email": "john.snow@iscoming.com",
            },
        }

    @patch("subprocess.Popen")
    def test_git_set_config_success(self, popen):
        # Given
        process_mock = Mock()
        attrs = {"communicate": Mock(return_value=(b"", b"")), "returncode": 0}
        process_mock.configure_mock(**attrs)
        popen.return_value = process_mock

        # When
        body = {
            "path": "test_path",
            "options": {
                "user.name": "John Snow",
                "user.email": "john.snow@iscoming.com",
            },
        }
        response = self.tester.post(["config"], body=body)

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

        assert response.status_code == 201
        payload = response.json()
        assert payload == {"code": 0, "message": ""}
