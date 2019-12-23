import subprocess
from unittest.mock import Mock, patch

from jupyterlab_git.handlers import GitRemoteAddHandler

from .testutils import assert_http_error, ServerTest


class TestAddRemote(ServerTest):
    @patch("subprocess.Popen")
    def test_git_add_remote_success_no_name(self, popen):
        # Given
        path = "test_path"
        url = "http://github.com/myid/myrepository.git"
        process_mock = Mock()
        attrs = {
            "communicate": Mock(return_value=(b"", b"",)),
            "returncode": 0,
        }
        process_mock.configure_mock(**attrs)
        popen.return_value = process_mock

        # When
        body = {
            "top_repo_path": path,
            "url": url,
        }
        response = self.tester.post(["remote", "add"], body=body)

        # Then
        popen.assert_called_once_with(
            ["git", "remote", "add", "origin", url],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=path,
        )
        process_mock.communicate.assert_called_once_with()

        assert response.status_code == 201
        payload = response.json()
        assert payload == {
            "code": 0,
            "cmd": " ".join(["git", "remote", "add", "origin", url]),
        }

    @patch("subprocess.Popen")
    def test_git_add_remote_success(self, popen):
        # Given
        path = "test_path"
        url = "http://github.com/myid/myrepository.git"
        name = "distant"
        process_mock = Mock()
        attrs = {
            "communicate": Mock(return_value=(b"", b"",)),
            "returncode": 0,
        }
        process_mock.configure_mock(**attrs)
        popen.return_value = process_mock

        # When
        body = {
            "top_repo_path": path,
            "url": url,
        }
        response = self.tester.post(["remote", "add"], body=body)

        # Then
        popen.assert_called_once_with(
            ["git", "remote", "add", name, url],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=path,
        )
        process_mock.communicate.assert_called_once_with()

        assert response.status_code == 201
        payload = response.json()
        assert payload == {
            "code": 0,
            "cmd": " ".join(["git", "remote", "add", name, url]),
        }

    @patch("subprocess.Popen")
    def test_git_add_remote_failure(self, popen):
        # Given
        path = "test_path"
        url = "http://github.com/myid/myrepository.git"
        process_mock = Mock()
        error_msg = "Fake failure"
        error_code = 128
        attrs = {
            "communicate": Mock(return_value=(b"", bytes(error_msg))),
            "returncode": error_code,
        }
        process_mock.configure_mock(**attrs)
        popen.return_value = process_mock

        # When
        body = {
            "top_repo_path": path,
            "url": url,
        }
        response = self.tester.post(["remote", "add"], body=body)

        # Then
        popen.assert_called_once_with(
            ["git", "remote", "add", "origin", url],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=path,
        )
        process_mock.communicate.assert_called_once_with()

        assert response.status_code == 500
        payload = response.json()
        assert payload == {
            "code": error_code,
            "cmd": " ".join(["git", "remote", "add", "origin", url]),
            "message": error_msg,
        }

