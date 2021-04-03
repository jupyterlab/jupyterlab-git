import json
import os
from pathlib import Path
from unittest.mock import ANY, Mock, call, patch

import requests
import tornado

from jupyterlab_git.git import Git
from jupyterlab_git.handlers import (
    GitAllHistoryHandler,
    GitBranchHandler,
    GitLogHandler,
    GitPushHandler,
    GitUpstreamHandler,
    setup_handlers,
)

from .testutils import ServerTest, assert_http_error, maybe_future


def test_mapping_added():
    mock_web_app = Mock()
    mock_web_app.settings = {"base_url": "nb_base_url"}
    setup_handlers(mock_web_app)

    mock_web_app.add_handlers.assert_called_once_with(".*", ANY)


class TestAllHistory(ServerTest):
    @patch("jupyterlab_git.handlers.GitAllHistoryHandler.git", spec=Git)
    def test_all_history_handler_localbranch(self, mock_git):
        # Given
        show_top_level = {"code": 0, "top_repo_path": "foo"}
        branch = "branch_foo"
        log = "log_foo"
        status = "status_foo"

        mock_git.show_top_level.return_value = maybe_future(show_top_level)
        mock_git.branch.return_value = maybe_future(branch)
        mock_git.log.return_value = maybe_future(log)
        mock_git.status.return_value = maybe_future(status)

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


class TestShowTopLevel(ServerTest):
    @patch("jupyterlab_git.git.execute")
    def test_git_show_top_level(self, mock_execute):
        # Given
        top_repo_path = "path/to/repo"

        mock_execute.return_value = maybe_future((0, str(top_repo_path), ""))

        # When
        body = {
            "current_path": top_repo_path + "/subfolder",
        }
        response = self.tester.post(["show_top_level"], body=body)

        # Then
        assert response.status_code == 200
        payload = response.json()
        assert payload["top_repo_path"] == top_repo_path
        mock_execute.assert_has_calls(
            [
                call(
                    ["git", "rev-parse", "--show-toplevel"],
                    cwd=os.path.join(self.notebook_dir, top_repo_path, "subfolder"),
                ),
            ]
        )

    @patch("jupyterlab_git.git.execute")
    def test_git_show_top_level_not_a_git_repo(self, mock_execute):
        # Given
        top_repo_path = "path/to/repo"

        mock_execute.return_value = maybe_future(
            (128, "", "fatal: not a git repository (or any")
        )

        # When
        body = {
            "current_path": top_repo_path + "/subfolder",
        }
        response = self.tester.post(["show_top_level"], body=body)

        # Then
        assert response.status_code == 200
        payload = response.json()
        assert payload["top_repo_path"] is None
        mock_execute.assert_has_calls(
            [
                call(
                    ["git", "rev-parse", "--show-toplevel"],
                    cwd=os.path.join(self.notebook_dir, top_repo_path, "subfolder"),
                ),
            ]
        )


class TestBranch(ServerTest):
    @patch("jupyterlab_git.handlers.GitBranchHandler.git", spec=Git)
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

        mock_git.branch.return_value = maybe_future(branch)

        # When
        body = {"current_path": "test_path"}
        response = self.tester.post(["branch"], body=body)

        # Then
        mock_git.branch.assert_called_with("test_path")

        assert response.status_code == 200
        payload = response.json()
        assert payload == {"code": 0, "branches": branch["branches"]}


class TestLog(ServerTest):
    @patch("jupyterlab_git.handlers.GitLogHandler.git", spec=Git)
    def test_log_handler(self, mock_git):
        # Given
        log = {"code": 0, "commits": []}
        mock_git.log.return_value = maybe_future(log)

        # When
        body = {"current_path": "test_path", "history_count": 20}
        response = self.tester.post(["log"], body=body)

        # Then
        mock_git.log.assert_called_with("test_path", 20)

        assert response.status_code == 200
        payload = response.json()
        assert payload == log

    @patch("jupyterlab_git.handlers.GitLogHandler.git", spec=Git)
    def test_log_handler_no_history_count(self, mock_git):
        # Given
        log = {"code": 0, "commits": []}
        mock_git.log.return_value = maybe_future(log)

        # When
        body = {"current_path": "test_path"}
        response = self.tester.post(["log"], body=body)

        # Then
        mock_git.log.assert_called_with("test_path", 25)

        assert response.status_code == 200
        payload = response.json()
        assert payload == log


class TestPush(ServerTest):
    @patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
    def test_push_handler_localbranch(self, mock_git):
        # Given
        mock_git.get_current_branch.return_value = maybe_future("localbranch")
        mock_git.get_upstream_branch.return_value = maybe_future(
            {"code": 0, "remote_short_name": ".", "remote_branch": "localbranch"}
        )
        mock_git.push.return_value = maybe_future({"code": 0})

        # When
        body = {"current_path": "test_path"}
        response = self.tester.post(["push"], body=body)

        # Then
        mock_git.get_current_branch.assert_called_with("test_path")
        mock_git.get_upstream_branch.assert_called_with("test_path", "localbranch")
        mock_git.push.assert_called_with(
            ".", "HEAD:localbranch", "test_path", None, False
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload == {"code": 0}

    @patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
    def test_push_handler_remotebranch(self, mock_git):
        # Given
        mock_git.get_current_branch.return_value = maybe_future("foo/bar")
        upstream = {
            "code": 0,
            "remote_short_name": "origin/something",
            "remote_branch": "remote-branch-name",
        }
        mock_git.get_upstream_branch.return_value = maybe_future(upstream)
        mock_git.push.return_value = maybe_future({"code": 0})

        # When
        body = {"current_path": "test_path"}
        response = self.tester.post(["push"], body=body)

        # Then
        mock_git.get_current_branch.assert_called_with("test_path")
        mock_git.get_upstream_branch.assert_called_with("test_path", "foo/bar")
        mock_git.push.assert_called_with(
            "origin/something", "HEAD:remote-branch-name", "test_path", None, False
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload == {"code": 0}

    @patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
    def test_push_handler_noupstream(self, mock_git):
        # Given
        mock_git.get_current_branch.return_value = maybe_future("foo")
        upstream = {
            "code": 128,
            "command": "",
            "message": "fatal: no upstream configured for branch 'foo'",
        }
        mock_git.get_upstream_branch.return_value = maybe_future(upstream)
        mock_git.config.return_value = maybe_future({"options": dict()})
        mock_git.remote_show.return_value = maybe_future({})
        mock_git.push.return_value = maybe_future({"code": 0})

        path = "test_path"

        # When
        body = {"current_path": path}
        try:
            self.tester.post(["push"], body=body)
        except requests.exceptions.HTTPError as error:
            response = error.response

        # Then
        mock_git.get_current_branch.assert_called_with(path)
        mock_git.get_upstream_branch.assert_called_with(path, "foo")
        mock_git.config.assert_called_with(path)
        mock_git.remote_show.assert_called_with(path)
        mock_git.push.assert_not_called()

        assert response.status_code == 500
        payload = response.json()
        assert payload == {
            "code": 128,
            "message": "fatal: The current branch foo has no upstream branch.",
            "remotes": list(),
        }

    @patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
    def test_push_handler_multipleupstream(self, mock_git):
        # Given
        remotes = ["origin", "upstream"]
        mock_git.get_current_branch.return_value = maybe_future("foo")
        upstream = {"code": -1, "message": "oups"}
        mock_git.get_upstream_branch.return_value = maybe_future(upstream)
        mock_git.config.return_value = maybe_future({"options": dict()})
        mock_git.remote_show.return_value = maybe_future({"remotes": remotes})
        mock_git.push.return_value = maybe_future({"code": 0})

        path = "test_path"

        # When
        body = {"current_path": path}
        try:
            self.tester.post(["push"], body=body)
        except requests.exceptions.HTTPError as error:
            response = error.response

        # Then
        mock_git.get_current_branch.assert_called_with(path)
        mock_git.get_upstream_branch.assert_called_with(path, "foo")
        mock_git.config.assert_called_with(path)
        mock_git.remote_show.assert_called_with(path)
        mock_git.push.assert_not_called()

        assert response.status_code == 500
        payload = response.json()
        assert payload == {
            "code": 128,
            "message": "fatal: The current branch foo has no upstream branch.",
            "remotes": remotes,
        }

    @patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
    def test_push_handler_noupstream_unique_remote(self, mock_git):
        # Given
        remote = "origin"
        mock_git.get_current_branch.return_value = maybe_future("foo")
        upstream = {"code": -1, "message": "oups"}
        mock_git.get_upstream_branch.return_value = maybe_future(upstream)
        mock_git.config.return_value = maybe_future({"options": dict()})
        mock_git.remote_show.return_value = maybe_future({"remotes": [remote]})
        mock_git.push.return_value = maybe_future({"code": 0})

        path = "test_path"

        # When
        body = {"current_path": path}
        response = self.tester.post(["push"], body=body)

        # Then
        mock_git.get_current_branch.assert_called_with(path)
        mock_git.get_upstream_branch.assert_called_with(path, "foo")
        mock_git.config.assert_called_with(path)
        mock_git.remote_show.assert_called_with(path)
        mock_git.push.assert_called_with(
            remote, "foo", "test_path", None, set_upstream=True
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload == {"code": 0}

    @patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
    def test_push_handler_noupstream_pushdefault(self, mock_git):
        # Given
        remote = "rorigin"
        mock_git.get_current_branch.return_value = maybe_future("foo")
        upstream = {"code": -1, "message": "oups"}
        mock_git.get_upstream_branch.return_value = maybe_future(upstream)
        mock_git.config.return_value = maybe_future(
            {"options": {"remote.pushdefault": remote}}
        )
        mock_git.remote_show.return_value = maybe_future(
            {"remotes": [remote, "upstream"]}
        )
        mock_git.push.return_value = maybe_future({"code": 0})

        path = "test_path"

        # When
        body = {"current_path": path}
        response = self.tester.post(["push"], body=body)

        # Then
        mock_git.get_current_branch.assert_called_with(path)
        mock_git.get_upstream_branch.assert_called_with(path, "foo")
        mock_git.config.assert_called_with(path)
        mock_git.remote_show.assert_called_with(path)
        mock_git.push.assert_called_with(
            remote, "foo", "test_path", None, set_upstream=True
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload == {"code": 0}

    @patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
    def test_push_handler_noupstream_pass_remote_nobranch(self, mock_git):
        # Given
        mock_git.get_current_branch.return_value = maybe_future("foo")
        upstream = {"code": -1, "message": "oups"}
        mock_git.get_upstream_branch.return_value = maybe_future(upstream)
        mock_git.config.return_value = maybe_future({"options": dict()})
        mock_git.remote_show.return_value = maybe_future({})
        mock_git.push.return_value = maybe_future({"code": 0})

        path = "test_path"
        remote = "online"

        # When
        body = {"current_path": path, "remote": remote}
        response = self.tester.post(["push"], body=body)

        # Then
        mock_git.get_current_branch.assert_called_with(path)
        mock_git.get_upstream_branch.assert_called_with(path, "foo")
        mock_git.config.assert_not_called()
        mock_git.remote_show.assert_not_called()
        mock_git.push.assert_called_with(remote, "HEAD:foo", "test_path", None, True)

        assert response.status_code == 200
        payload = response.json()
        assert payload == {"code": 0}

    @patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
    def test_push_handler_noupstream_pass_remote_branch(self, mock_git):
        # Given
        mock_git.get_current_branch.return_value = maybe_future("foo")
        upstream = {"code": -1, "message": "oups"}
        mock_git.get_upstream_branch.return_value = maybe_future(upstream)
        mock_git.config.return_value = maybe_future({"options": dict()})
        mock_git.remote_show.return_value = maybe_future({})
        mock_git.push.return_value = maybe_future({"code": 0})

        path = "test_path"
        remote = "online"
        remote_branch = "onfoo"

        # When
        body = {"current_path": path, "remote": "/".join((remote, remote_branch))}
        response = self.tester.post(["push"], body=body)

        # Then
        mock_git.get_current_branch.assert_called_with(path)
        mock_git.get_upstream_branch.assert_called_with(path, "foo")
        mock_git.config.assert_not_called()
        mock_git.remote_show.assert_not_called()
        mock_git.push.assert_called_with(
            remote, "HEAD:" + remote_branch, "test_path", None, True
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload == {"code": 0}


class TestUpstream(ServerTest):
    @patch("jupyterlab_git.handlers.GitUpstreamHandler.git", spec=Git)
    def test_upstream_handler_forward_slashes(self, mock_git):
        # Given
        mock_git.get_current_branch.return_value = maybe_future("foo/bar")
        upstream = {
            "code": 0,
            "remote_short_name": "origin/something",
            "remote_branch": "foo/bar",
        }
        mock_git.get_upstream_branch.return_value = maybe_future(upstream)

        # When
        body = {"current_path": "test_path"}
        response = self.tester.post(["upstream"], body=body)

        # Then
        mock_git.get_current_branch.assert_called_with("test_path")
        mock_git.get_upstream_branch.assert_called_with("test_path", "foo/bar")

        assert response.status_code == 200
        payload = response.json()
        assert payload == upstream

    @patch("jupyterlab_git.handlers.GitUpstreamHandler.git", spec=Git)
    def test_upstream_handler_localbranch(self, mock_git):
        # Given
        mock_git.get_current_branch.return_value = maybe_future("foo/bar")
        upstream = {"code": 0, "remote_short_name": ".", "remote_branch": "foo/bar"}
        mock_git.get_upstream_branch.return_value = maybe_future(upstream)

        # When
        body = {"current_path": "test_path"}
        response = self.tester.post(["upstream"], body=body)

        # Then
        mock_git.get_current_branch.assert_called_with("test_path")
        mock_git.get_upstream_branch.assert_called_with("test_path", "foo/bar")

        assert response.status_code == 200
        payload = response.json()
        assert payload == upstream


class TestContent(ServerTest):
    @patch("jupyterlab_git.git.execute")
    def test_content(self, mock_execute):
        # Given
        top_repo_path = "path/to/repo"
        filename = "my/file"
        content = "dummy content file\nwith multiple lines"

        mock_execute.side_effect = [
            maybe_future((0, "1\t1\t{}".format(filename), "")),
            maybe_future((0, content, "")),
        ]

        # When
        body = {
            "filename": filename,
            "reference": {"git": "previous"},
            "top_repo_path": top_repo_path,
        }
        response = self.tester.post(["content"], body=body)

        # Then
        assert response.status_code == 200
        payload = response.json()
        assert payload["content"] == content
        mock_execute.assert_has_calls(
            [
                call(
                    ["git", "show", "{}:{}".format("previous", filename)],
                    cwd=os.path.join(self.notebook_dir, top_repo_path),
                ),
            ],
        )

    @patch("jupyterlab_git.git.execute")
    def test_content_working(self, mock_execute):
        # Given
        top_repo_path = "path/to/repo"
        filename = "my/file"
        content = "dummy content file\nwith multiple lines"

        mock_execute.side_effect = [
            maybe_future((0, content, "")),
        ]

        dummy_file = Path(self.notebook_dir) / top_repo_path / filename
        dummy_file.parent.mkdir(parents=True)
        dummy_file.write_text(content)

        # When
        body = {
            "filename": filename,
            "reference": {"special": "WORKING"},
            "top_repo_path": top_repo_path,
        }
        response = self.tester.post(["content"], body=body)

        # Then
        assert response.status_code == 200
        payload = response.json()
        assert payload["content"] == content

    @patch("jupyterlab_git.git.execute")
    def test_content_index(self, mock_execute):
        # Given
        top_repo_path = "path/to/repo"
        filename = "my/file"
        content = "dummy content file\nwith multiple lines"

        mock_execute.side_effect = [
            maybe_future((0, "1\t1\t{}".format(filename), "")),
            maybe_future((0, content, "")),
        ]

        # When
        body = {
            "filename": filename,
            "reference": {"special": "INDEX"},
            "top_repo_path": top_repo_path,
        }
        response = self.tester.post(["content"], body=body)

        # Then
        assert response.status_code == 200
        payload = response.json()
        assert payload["content"] == content
        mock_execute.assert_has_calls(
            [
                call(
                    ["git", "show", "{}:{}".format("", filename)],
                    cwd=os.path.join(self.notebook_dir, top_repo_path),
                ),
            ],
        )

    @patch("jupyterlab_git.git.execute")
    def test_content_unknown_special(self, mock_execute):
        # Given
        top_repo_path = "path/to/repo"
        filename = "my/file"
        content = "dummy content file\nwith multiple lines"

        mock_execute.side_effect = [
            maybe_future((0, "1\t1\t{}".format(filename), "")),
            maybe_future((0, content, "")),
        ]

        # When
        body = {
            "filename": filename,
            "reference": {"special": "unknown"},
            "top_repo_path": top_repo_path,
        }

        with assert_http_error(500, msg="unknown special ref"):
            self.tester.post(["content"], body=body)

    @patch("jupyterlab_git.git.execute")
    def test_content_show_handled_error(self, mock_execute):
        # Given
        top_repo_path = "path/to/repo"
        filename = "my/file"

        mock_execute.return_value = maybe_future(
            (
                -1,
                "",
                "fatal: Path '{}' does not exist (neither on disk nor in the index)".format(
                    filename
                ),
            )
        )

        # When
        body = {
            "filename": filename,
            "reference": {"git": "current"},
            "top_repo_path": top_repo_path,
        }
        response = self.tester.post(["content"], body=body)

        # Then
        assert response.status_code == 200
        payload = response.json()
        assert payload["content"] == ""

    @patch("jupyterlab_git.git.execute")
    def test_content_binary(self, mock_execute):
        # Given
        top_repo_path = "path/to/repo"
        filename = "my/file"

        mock_execute.return_value = maybe_future((0, "-\t-\t{}".format(filename), ""))

        # When
        body = {
            "filename": filename,
            "reference": {"git": "current"},
            "top_repo_path": top_repo_path,
        }

        # Then
        with assert_http_error(500, msg="file is not UTF-8"):
            self.tester.post(["content"], body=body)

    @patch("jupyterlab_git.git.execute")
    def test_content_show_unhandled_error(self, mock_execute):
        # Given
        top_repo_path = "path/to/repo"
        filename = "my/file"

        mock_execute.return_value = maybe_future((-1, "", "Dummy error"))

        # When
        body = {
            "filename": filename,
            "reference": {"git": "current"},
            "top_repo_path": top_repo_path,
        }

        # Then
        with assert_http_error(500, msg="Dummy error"):
            self.tester.post(["content"], body=body)

    @patch("jupyterlab_git.git.execute")
    def test_content_getcontent_deleted_file(self, mock_execute):
        # Given
        top_repo_path = "path/to/repo"
        filename = "my/absent_file"
        content = "dummy content file\nwith multiple lines"

        # When
        body = {
            "filename": filename,
            "reference": {"special": "WORKING"},
            "top_repo_path": top_repo_path,
        }
        # Then
        response = self.tester.post(["content"], body=body)

        # Then
        assert response.status_code == 200
        payload = response.json()
        assert payload["content"] == ""
