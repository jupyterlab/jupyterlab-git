import json
import os
import subprocess
from unittest.mock import ANY, call, Mock, patch

from jupyterlab_git.handlers import (
    GitAllHistoryHandler,
    GitBranchHandler,
    GitLogHandler,
    GitPushHandler,
    GitUpstreamHandler,
    setup_handlers,
)

from .testutils import assert_http_error, ServerTest


def test_mapping_added():
    mock_web_app = Mock()
    mock_web_app.settings = {"base_url": "nb_base_url"}
    setup_handlers(mock_web_app)

    mock_web_app.add_handlers.assert_called_once_with(".*", ANY)


class TestAllHistory(ServerTest):
    @patch("jupyterlab_git.handlers.GitAllHistoryHandler.git")
    def test_all_history_handler_localbranch(self, mock_git):
        # Given
        show_top_level = {"code": 0, "foo": "top_level"}
        branch = "branch_foo"
        log = "log_foo"
        status = "status_foo"

        mock_git.show_top_level.return_value = show_top_level
        mock_git.branch.return_value = branch
        mock_git.log.return_value = log
        mock_git.status.return_value = status

        # When
        body = {"current_path": "test_path", "history_count": 25}
        response = self.tester.post(["all_history"], body=body)

        # Then
        mock_git.show_top_level.assert_called_with("test_path")
        mock_git.branch.assert_called_with("test_path")
        mock_git.log.assert_called_with("test_path", 25)
        mock_git.status.assert_called_with("test_path")

        assert response.status_code == 200
        payload = response.json()
        assert payload == {
            "code": show_top_level["code"],
            "data": {
                "show_top_level": show_top_level,
                "branch": branch,
                "log": log,
                "status": status,
            },
        }


class TestBranch(ServerTest):
    @patch("jupyterlab_git.handlers.GitBranchHandler.git")
    def test_branch_handler_localbranch(self, mock_git):
        # Given
        branch = {
            "code": 0,
            "branches": [
                {
                    "is_current_branch": True,
                    "is_remote_branch": False,
                    "name": "feature-foo",
                    "upstream": "origin/feature-foo",
                    "top_commit": "abcdefghijklmnopqrstuvwxyz01234567890123",
                    "tag": None,
                },
                {
                    "is_current_branch": False,
                    "is_remote_branch": False,
                    "name": "master",
                    "upstream": "origin/master",
                    "top_commit": "abcdefghijklmnopqrstuvwxyz01234567890123",
                    "tag": None,
                },
                {
                    "is_current_branch": False,
                    "is_remote_branch": False,
                    "name": "feature-bar",
                    "upstream": None,
                    "top_commit": "01234567899999abcdefghijklmnopqrstuvwxyz",
                    "tag": None,
                },
                {
                    "is_current_branch": False,
                    "is_remote_branch": True,
                    "name": "origin/feature-foo",
                    "upstream": None,
                    "top_commit": "abcdefghijklmnopqrstuvwxyz01234567890123",
                    "tag": None,
                },
                {
                    "is_current_branch": False,
                    "is_remote_branch": True,
                    "name": "origin/master",
                    "upstream": None,
                    "top_commit": "abcdefghijklmnopqrstuvwxyz01234567890123",
                    "tag": None,
                },
            ],
        }

        mock_git.branch.return_value = branch

        # When
        body = {"current_path": "test_path"}
        response = self.tester.post(["branch"], body=body)

        # Then
        mock_git.branch.assert_called_with("test_path")

        assert response.status_code == 200
        payload = response.json()
        assert payload == {"code": 0, "branches": branch["branches"]}


class TestLog(ServerTest):
    @patch("jupyterlab_git.handlers.GitLogHandler.git")
    def test_log_handler(self, mock_git):
        # Given
        log = {"code": 0, "commits": []}
        mock_git.log.return_value = log

        # When
        body = {"current_path": "test_path", "history_count": 20}
        response = self.tester.post(["log"], body=body)

        # Then
        mock_git.log.assert_called_with("test_path", 20)

        assert response.status_code == 200
        payload = response.json()
        assert payload == log

    @patch("jupyterlab_git.handlers.GitLogHandler.git")
    def test_log_handler_no_history_count(self, mock_git):
        # Given
        log = {"code": 0, "commits": []}
        mock_git.log.return_value = log

        # When
        body = {"current_path": "test_path"}
        response = self.tester.post(["log"], body=body)

        # Then
        mock_git.log.assert_called_with("test_path", 25)

        assert response.status_code == 200
        payload = response.json()
        assert payload == log


class TestPush(ServerTest):
    @patch("jupyterlab_git.handlers.GitPushHandler.git")
    def test_push_handler_localbranch(self, mock_git):
        # Given
        mock_git.get_current_branch.return_value = "foo"
        mock_git.get_upstream_branch.return_value = "localbranch"
        mock_git.push.return_value = {"code": 0}

        # When
        body = {"current_path": "test_path"}
        response = self.tester.post(["push"], body=body)

        # Then
        mock_git.get_current_branch.assert_called_with("test_path")
        mock_git.get_upstream_branch.assert_called_with("test_path", "foo")
        mock_git.push.assert_called_with(".", "HEAD:localbranch", "test_path", None)

        assert response.status_code == 200
        payload = response.json()
        assert payload == {"code": 0}

    @patch("jupyterlab_git.handlers.GitPushHandler.git")
    def test_push_handler_remotebranch(self, mock_git):
        # Given
        mock_git.get_current_branch.return_value = "foo"
        mock_git.get_upstream_branch.return_value = "origin/remotebranch"
        mock_git.push.return_value = {"code": 0}

        # When
        body = {"current_path": "test_path"}
        response = self.tester.post(["push"], body=body)

        # Then
        mock_git.get_current_branch.assert_called_with("test_path")
        mock_git.get_upstream_branch.assert_called_with("test_path", "foo")
        mock_git.push.assert_called_with(
            "origin", "HEAD:remotebranch", "test_path", None
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload == {"code": 0}

    @patch("jupyterlab_git.handlers.GitPushHandler.git")
    def test_push_handler_noupstream(self, mock_git):
        # Given
        mock_git.get_current_branch.return_value = "foo"
        mock_git.get_upstream_branch.return_value = ""
        mock_git.push.return_value = {"code": 0}

        # When
        body = {"current_path": "test_path"}
        response = self.tester.post(["push"], body=body)

        # Then
        mock_git.get_current_branch.assert_called_with("test_path")
        mock_git.get_upstream_branch.assert_called_with("test_path", "foo")
        mock_git.push.assert_not_called()

        assert response.status_code == 200
        payload = response.json()
        assert payload == {
            "code": 128,
            "message": "fatal: The current branch foo has no upstream branch.",
        }


class TestUpstream(ServerTest):
    @patch("jupyterlab_git.handlers.GitUpstreamHandler.git")
    def test_upstream_handler_localbranch(self, mock_git):
        # Given
        mock_git.get_current_branch.return_value = "foo"
        mock_git.get_upstream_branch.return_value = "bar"

        # When
        body = {"current_path": "test_path"}
        response = self.tester.post(["upstream"], body=body)

        # Then
        mock_git.get_current_branch.assert_called_with("test_path")
        mock_git.get_upstream_branch.assert_called_with("test_path", "foo")

        assert response.status_code == 200
        payload = response.json()
        assert payload == {"upstream": "bar"}


class TestDiffContent(ServerTest):
    @patch("subprocess.Popen")
    def test_diffcontent(self, popen):
        # Given
        top_repo_path = "path/to/repo"
        filename = "my/file"
        content = "dummy content file\nwith multiplelines"

        process_mock = Mock()
        attrs = {
            "communicate": Mock(return_value=(bytes(content, encoding="utf-8"), b"")),
            "returncode": 0,
        }
        process_mock.configure_mock(**attrs)
        popen.return_value = process_mock

        # When
        body = {
            "filename": filename,
            "prev_ref": {"git": "previous"},
            "curr_ref": {"git": "current"},
            "top_repo_path": top_repo_path,
        }
        response = self.tester.post(["diffcontent"], body=body)

        # Then
        assert response.status_code == 200
        payload = response.json()
        assert payload["prev_content"] == content
        assert payload["curr_content"] == content
        popen.assert_has_calls(
            [
                call(
                    ["git", "show", "{}:{}".format("previous", filename)],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    cwd=os.path.join(self.notebook_dir, top_repo_path),
                ),
                call().communicate(),
                call(
                    ["git", "show", "{}:{}".format("current", filename)],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    cwd=os.path.join(self.notebook_dir, top_repo_path),
                ),
                call().communicate(),
            ]
        )

    @patch("subprocess.Popen")
    def test_diffcontent_working(self, popen):
        # Given
        top_repo_path = "path/to/repo"
        filename = "my/file"
        content = "dummy content file\nwith multiplelines"

        process_mock = Mock()
        attrs = {
            "communicate": Mock(return_value=(bytes(content, encoding="utf-8"), b"")),
            "returncode": 0,
        }
        process_mock.configure_mock(**attrs)
        popen.return_value = process_mock

        dummy_file = os.path.join(self.notebook_dir, top_repo_path, filename)
        os.makedirs(os.path.dirname(dummy_file))
        with open(dummy_file, "w") as f:
            f.write(content)

        # When
        body = {
            "filename": filename,
            "prev_ref": {"git": "previous"},
            "curr_ref": {"special": "WORKING"},
            "top_repo_path": top_repo_path,
        }
        response = self.tester.post(["diffcontent"], body=body)

        # Then
        assert response.status_code == 200
        payload = response.json()
        assert payload["prev_content"] == content
        assert payload["curr_content"] == content
        popen.assert_has_calls(
            [
                call(
                    ["git", "show", "{}:{}".format("previous", filename)],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    cwd=os.path.join(self.notebook_dir, top_repo_path),
                ),
                call().communicate(),
            ]
        )

    @patch("subprocess.Popen")
    def test_diffcontent_index(self, popen):
        # Given
        top_repo_path = "path/to/repo"
        filename = "my/file"
        content = "dummy content file\nwith multiplelines"

        process_mock = Mock()
        attrs = {
            "communicate": Mock(return_value=(bytes(content, encoding="utf-8"), b"")),
            "returncode": 0,
        }
        process_mock.configure_mock(**attrs)
        popen.return_value = process_mock

        # When
        body = {
            "filename": filename,
            "prev_ref": {"git": "previous"},
            "curr_ref": {"special": "INDEX"},
            "top_repo_path": top_repo_path,
        }
        response = self.tester.post(["diffcontent"], body=body)

        # Then
        assert response.status_code == 200
        payload = response.json()
        assert payload["prev_content"] == content
        assert payload["curr_content"] == content
        popen.assert_has_calls(
            [
                call(
                    ["git", "show", "{}:{}".format("previous", filename)],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    cwd=os.path.join(self.notebook_dir, top_repo_path),
                ),
                call().communicate(),
                call(
                    ["git", "show", "{}:{}".format("", filename)],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    cwd=os.path.join(self.notebook_dir, top_repo_path),
                ),
                call().communicate(),
            ]
        )

    @patch("subprocess.Popen")
    def test_diffcontent_unknown_special(self, popen):
        # Given
        top_repo_path = "path/to/repo"
        filename = "my/file"
        content = "dummy content file\nwith multiplelines"

        process_mock = Mock()
        attrs = {
            "communicate": Mock(return_value=(bytes(content, encoding="utf-8"), b"")),
            "returncode": 0,
        }
        process_mock.configure_mock(**attrs)
        popen.return_value = process_mock

        # When
        body = {
            "filename": filename,
            "prev_ref": {"git": "previous"},
            "curr_ref": {"special": "unknown"},
            "top_repo_path": top_repo_path,
        }

        with assert_http_error(500, msg="unknown special ref"):
            self.tester.post(["diffcontent"], body=body)

    @patch("subprocess.Popen")
    def test_diffcontent_show_handled_error(self, popen):
        # Given
        top_repo_path = "path/to/repo"
        filename = "my/file"

        process_mock = Mock()
        attrs = {
            "communicate": Mock(
                return_value=(
                    b"",
                    bytes(
                        "fatal: Path '{}' does not exist (neither on disk nor in the index)".format(
                            filename
                        ),
                        encoding="utf-8",
                    ),
                )
            ),
            "returncode": -1,
        }
        process_mock.configure_mock(**attrs)
        popen.return_value = process_mock

        # When
        body = {
            "filename": filename,
            "prev_ref": {"git": "previous"},
            "curr_ref": {"git": "current"},
            "top_repo_path": top_repo_path,
        }
        response = self.tester.post(["diffcontent"], body=body)

        # Then
        assert response.status_code == 200
        payload = response.json()
        assert payload["prev_content"] == ""
        assert payload["curr_content"] == ""

    @patch("subprocess.Popen")
    def test_diffcontent_show_unhandled_error(self, popen):
        # Given
        top_repo_path = "path/to/repo"
        filename = "my/file"

        process_mock = Mock()
        attrs = {
            "communicate": Mock(return_value=(b"", b"Dummy error")),
            "returncode": -1,
        }
        process_mock.configure_mock(**attrs)
        popen.return_value = process_mock

        # When
        body = {
            "filename": filename,
            "prev_ref": {"git": "previous"},
            "curr_ref": {"git": "current"},
            "top_repo_path": top_repo_path,
        }

        # Then
        with assert_http_error(500, msg="Dummy error"):
            self.tester.post(["diffcontent"], body=body)

    @patch("subprocess.Popen")
    def test_diffcontent_getcontent_error(self, popen):
        # Given
        top_repo_path = "path/to/repo"
        filename = "my/absent_file"
        content = "dummy content file\nwith multiplelines"

        process_mock = Mock()
        attrs = {
            "communicate": Mock(return_value=(bytes(content, encoding="utf-8"), b"")),
            "returncode": 0,
        }
        process_mock.configure_mock(**attrs)
        popen.return_value = process_mock

        # When
        body = {
            "filename": filename,
            "prev_ref": {"git": "previous"},
            "curr_ref": {"special": "WORKING"},
            "top_repo_path": top_repo_path,
        }
        # Then
        with assert_http_error(404, msg="No such file or directory"):
            r = self.tester.post(["diffcontent"], body=body)
