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
    def test_git_get_config_multiline(self, popen):
        # Given
        process_mock = Mock()
        attrs = {
            "communicate": Mock(
                return_value=(
                    b"user.name=John Snow\n"
                    b"user.email=john.snow@iscoming.com\n"
                    b'alias.summary=!f() {     printf "Summary of this branch...\n'
                    b'";     printf "%s\n'
                    b'" $(git rev-parse --abbrev-ref HEAD);     printf "\n'
                    b"Most-active files, with churn count\n"
                    b'"; git churn | head -7;   }; f\n'
                    b'alias.topic-base-branch-name=!f(){     printf "master\n'
                    b'";   };f\n'
                    b'alias.topic-start=!f(){     topic_branch="$1";     git topic-create "$topic_branch";     git topic-push;   };f',
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
    @patch(
        "jupyterlab_git.git.ALLOWED_OPTIONS",
        ["alias.summary", "alias.topic-base-branch-name"],
    )
    def test_git_get_config_accepted_multiline(self, popen):
        # Given
        process_mock = Mock()
        attrs = {
            "communicate": Mock(
                return_value=(
                    b"user.name=John Snow\n"
                    b"user.email=john.snow@iscoming.com\n"
                    b'alias.summary=!f() {     printf "Summary of this branch...\n'
                    b'";     printf "%s\n'
                    b'" $(git rev-parse --abbrev-ref HEAD);     printf "\n'
                    b"Most-active files, with churn count\n"
                    b'"; git churn | head -7;   }; f\n'
                    b'alias.topic-base-branch-name=!f(){     printf "master\n'
                    b'";   };f\n'
                    b'alias.topic-start=!f(){     topic_branch="$1";     git topic-create "$topic_branch";     git topic-push;   };f',
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
                "alias.summary": '!f() {     printf "Summary of this branch...\n'
                '";     printf "%s\n'
                '" $(git rev-parse --abbrev-ref HEAD);     printf "\n'
                "Most-active files, with churn count\n"
                '"; git churn | head -7;   }; f',
                "alias.topic-base-branch-name": '!f(){     printf "master\n";   };f',
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
