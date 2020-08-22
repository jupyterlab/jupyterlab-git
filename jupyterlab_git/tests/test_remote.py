import subprocess
from unittest.mock import Mock, patch

from jupyterlab_git.handlers import GitRemoteAddHandler

from .testutils import assert_http_error, ServerTest, maybe_future


class TestAddRemote(ServerTest):
    @patch("jupyterlab_git.git.execute")
    def test_git_add_remote_success_no_name(self, mock_execute):
        # Given
        path = "test_path"
        url = "http://github.com/myid/myrepository.git"
        mock_execute.return_value = maybe_future((0, "", ""))

        # When
        body = {
            "top_repo_path": path,
            "url": url,
        }
        response = self.tester.post(["remote", "add"], body=body)

        # Then
        command = ["git", "remote", "add", "origin", url]
        mock_execute.assert_called_once_with(command, cwd=path)

        assert response.status_code == 201
        payload = response.json()
        assert payload == {
            "code": 0,
            "command": " ".join(command),
        }

    @patch("jupyterlab_git.git.execute")
    def test_git_add_remote_success(self, mock_execute):
        # Given
        path = "test_path"
        url = "http://github.com/myid/myrepository.git"
        name = "distant"
        mock_execute.return_value = maybe_future((0, "", ""))

        # When
        body = {"top_repo_path": path, "url": url, "name": name}
        response = self.tester.post(["remote", "add"], body=body)

        # Then
        command = ["git", "remote", "add", name, url]
        mock_execute.assert_called_once_with(command, cwd=path)

        assert response.status_code == 201
        payload = response.json()
        assert payload == {
            "code": 0,
            "command": " ".join(command),
        }

    @patch("jupyterlab_git.git.execute")
    def test_git_add_remote_failure(self, mock_execute):
        # Given
        path = "test_path"
        url = "http://github.com/myid/myrepository.git"
        error_msg = "Fake failure"
        error_code = 128
        mock_execute.return_value = maybe_future((error_code, "", error_msg))

        # When
        body = {
            "top_repo_path": path,
            "url": url,
        }
        with assert_http_error(500):
            self.tester.post(["remote", "add"], body=body)

        # Then
        mock_execute.assert_called_once_with(
            ["git", "remote", "add", "origin", url], cwd=path
        )
