import json
from pathlib import Path
from unittest.mock import ANY, Mock, call, patch

import pytest
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

from .testutils import NS, assert_http_error, maybe_future


def test_mapping_added():
    mock_web_app = Mock()
    mock_web_app.settings = {"base_url": "nb_base_url"}
    setup_handlers(mock_web_app)

    mock_web_app.add_handlers.assert_called_once_with(".*", ANY)


@patch("jupyterlab_git.handlers.GitAllHistoryHandler.git", spec=Git)
async def test_all_history_handler_localbranch(mock_git, jp_fetch):
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
    response = await jp_fetch(NS, "all_history", body=json.dumps(body), method="POST")

    # Then
    mock_git.show_top_level.assert_called_with("test_path")
    mock_git.branch.assert_called_with("test_path")
    mock_git.log.assert_called_with("test_path", 25)
    mock_git.status.assert_called_with("test_path")

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {
        "code": show_top_level["code"],
        "data": {
            "show_top_level": show_top_level,
            "branch": branch,
            "log": log,
            "status": status,
        },
    }


@patch("jupyterlab_git.git.execute")
async def test_git_show_top_level(mock_execute, jp_fetch, jp_root_dir):
    # Given
    top_repo_path = "path/to/repo"

    mock_execute.return_value = maybe_future((0, str(top_repo_path), ""))

    # When
    body = {
        "current_path": top_repo_path + "/subfolder",
    }
    response = await jp_fetch(
        NS, "show_top_level", body=json.dumps(body), method="POST"
    )

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["top_repo_path"] == top_repo_path
    mock_execute.assert_has_calls(
        [
            call(
                ["git", "rev-parse", "--show-toplevel"],
                cwd=str(jp_root_dir / top_repo_path / "subfolder"),
            ),
        ]
    )


@patch("jupyterlab_git.git.execute")
async def test_git_show_top_level_not_a_git_repo(mock_execute, jp_fetch, jp_root_dir):
    # Given
    top_repo_path = "path/to/repo"

    mock_execute.return_value = maybe_future(
        (128, "", "fatal: not a git repository (or any")
    )

    # When
    body = {
        "current_path": top_repo_path + "/subfolder",
    }
    response = await jp_fetch(
        NS, "show_top_level", body=json.dumps(body), method="POST"
    )

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["top_repo_path"] is None
    mock_execute.assert_has_calls(
        [
            call(
                ["git", "rev-parse", "--show-toplevel"],
                cwd=str(jp_root_dir / top_repo_path / "subfolder"),
            ),
        ]
    )


@patch("jupyterlab_git.handlers.GitBranchHandler.git", spec=Git)
async def test_branch_handler_localbranch(mock_git, jp_fetch):
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
    response = await jp_fetch(NS, "branch", body=json.dumps(body), method="POST")

    # Then
    mock_git.branch.assert_called_with("test_path")

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"code": 0, "branches": branch["branches"]}


@patch("jupyterlab_git.handlers.GitLogHandler.git", spec=Git)
async def test_log_handler(mock_git, jp_fetch):
    # Given
    log = {"code": 0, "commits": []}
    mock_git.log.return_value = maybe_future(log)

    # When
    body = {"current_path": "test_path", "history_count": 20}
    response = await jp_fetch(NS, "log", body=json.dumps(body), method="POST")

    # Then
    mock_git.log.assert_called_with("test_path", 20)

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == log


@patch("jupyterlab_git.handlers.GitLogHandler.git", spec=Git)
async def test_log_handler_no_history_count(mock_git, jp_fetch):
    # Given
    log = {"code": 0, "commits": []}
    mock_git.log.return_value = maybe_future(log)

    # When
    body = {"current_path": "test_path"}
    response = await jp_fetch(NS, "log", body=json.dumps(body), method="POST")

    # Then
    mock_git.log.assert_called_with("test_path", 25)

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == log


@patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
async def test_push_handler_localbranch(mock_git, jp_fetch):
    # Given
    mock_git.get_current_branch.return_value = maybe_future("localbranch")
    mock_git.get_upstream_branch.return_value = maybe_future(
        {"code": 0, "remote_short_name": ".", "remote_branch": "localbranch"}
    )
    mock_git.push.return_value = maybe_future({"code": 0})

    # When
    body = {"current_path": "test_path"}
    response = await jp_fetch(NS, "push", body=json.dumps(body), method="POST")

    # Then
    mock_git.get_current_branch.assert_called_with("test_path")
    mock_git.get_upstream_branch.assert_called_with("test_path", "localbranch")
    mock_git.push.assert_called_with(".", "HEAD:localbranch", "test_path", None, False)

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"code": 0}


@patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
async def test_push_handler_remotebranch(mock_git, jp_fetch):
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
    response = await jp_fetch(NS, "push", body=json.dumps(body), method="POST")

    # Then
    mock_git.get_current_branch.assert_called_with("test_path")
    mock_git.get_upstream_branch.assert_called_with("test_path", "foo/bar")
    mock_git.push.assert_called_with(
        "origin/something", "HEAD:remote-branch-name", "test_path", None, False
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"code": 0}


@patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
async def test_push_handler_noupstream(mock_git, jp_fetch):
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

    with pytest.raises(tornado.httpclient.HTTPClientError) as e:
        await jp_fetch(NS, "push", body=json.dumps(body), method="POST")

    response = e.value.response

    # Then
    mock_git.get_current_branch.assert_called_with(path)
    mock_git.get_upstream_branch.assert_called_with(path, "foo")
    mock_git.config.assert_called_with(path)
    mock_git.remote_show.assert_called_with(path)
    mock_git.push.assert_not_called()

    assert response.code == 500
    payload = json.loads(response.body)
    assert payload == {
        "code": 128,
        "message": "fatal: The current branch foo has no upstream branch.",
        "remotes": list(),
    }


@patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
async def test_push_handler_multipleupstream(mock_git, jp_fetch):
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
    with pytest.raises(tornado.httpclient.HTTPClientError) as e:
        await jp_fetch(NS, "push", body=json.dumps(body), method="POST")
    response = e.value.response

    # Then
    mock_git.get_current_branch.assert_called_with(path)
    mock_git.get_upstream_branch.assert_called_with(path, "foo")
    mock_git.config.assert_called_with(path)
    mock_git.remote_show.assert_called_with(path)
    mock_git.push.assert_not_called()

    assert response.code == 500
    payload = json.loads(response.body)
    assert payload == {
        "code": 128,
        "message": "fatal: The current branch foo has no upstream branch.",
        "remotes": remotes,
    }


@patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
async def test_push_handler_noupstream_unique_remote(mock_git, jp_fetch):
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
    response = await jp_fetch(NS, "push", body=json.dumps(body), method="POST")

    # Then
    mock_git.get_current_branch.assert_called_with(path)
    mock_git.get_upstream_branch.assert_called_with(path, "foo")
    mock_git.config.assert_called_with(path)
    mock_git.remote_show.assert_called_with(path)
    mock_git.push.assert_called_with(
        remote, "foo", "test_path", None, set_upstream=True
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"code": 0}


@patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
async def test_push_handler_noupstream_pushdefault(mock_git, jp_fetch):
    # Given
    remote = "rorigin"
    mock_git.get_current_branch.return_value = maybe_future("foo")
    upstream = {"code": -1, "message": "oups"}
    mock_git.get_upstream_branch.return_value = maybe_future(upstream)
    mock_git.config.return_value = maybe_future(
        {"options": {"remote.pushdefault": remote}}
    )
    mock_git.remote_show.return_value = maybe_future({"remotes": [remote, "upstream"]})
    mock_git.push.return_value = maybe_future({"code": 0})

    path = "test_path"

    # When
    body = {"current_path": path}
    response = await jp_fetch(NS, "push", body=json.dumps(body), method="POST")

    # Then
    mock_git.get_current_branch.assert_called_with(path)
    mock_git.get_upstream_branch.assert_called_with(path, "foo")
    mock_git.config.assert_called_with(path)
    mock_git.remote_show.assert_called_with(path)
    mock_git.push.assert_called_with(
        remote, "foo", "test_path", None, set_upstream=True
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"code": 0}


@patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
async def test_push_handler_noupstream_pass_remote_nobranch(mock_git, jp_fetch):
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
    response = await jp_fetch(NS, "push", body=json.dumps(body), method="POST")

    # Then
    mock_git.get_current_branch.assert_called_with(path)
    mock_git.get_upstream_branch.assert_called_with(path, "foo")
    mock_git.config.assert_not_called()
    mock_git.remote_show.assert_not_called()
    mock_git.push.assert_called_with(remote, "HEAD:foo", "test_path", None, True)

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"code": 0}


@patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
async def test_push_handler_noupstream_pass_remote_branch(mock_git, jp_fetch):
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
    response = await jp_fetch(NS, "push", body=json.dumps(body), method="POST")

    # Then
    mock_git.get_current_branch.assert_called_with(path)
    mock_git.get_upstream_branch.assert_called_with(path, "foo")
    mock_git.config.assert_not_called()
    mock_git.remote_show.assert_not_called()
    mock_git.push.assert_called_with(
        remote, "HEAD:" + remote_branch, "test_path", None, True
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"code": 0}


@patch("jupyterlab_git.handlers.GitUpstreamHandler.git", spec=Git)
async def test_upstream_handler_forward_slashes(mock_git, jp_fetch):
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
    response = await jp_fetch(NS, "upstream", body=json.dumps(body), method="POST")

    # Then
    mock_git.get_current_branch.assert_called_with("test_path")
    mock_git.get_upstream_branch.assert_called_with("test_path", "foo/bar")

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == upstream


@patch("jupyterlab_git.handlers.GitUpstreamHandler.git", spec=Git)
async def test_upstream_handler_localbranch(mock_git, jp_fetch):
    # Given
    mock_git.get_current_branch.return_value = maybe_future("foo/bar")
    upstream = {"code": 0, "remote_short_name": ".", "remote_branch": "foo/bar"}
    mock_git.get_upstream_branch.return_value = maybe_future(upstream)

    # When
    body = {"current_path": "test_path"}
    response = await jp_fetch(NS, "upstream", body=json.dumps(body), method="POST")

    # Then
    mock_git.get_current_branch.assert_called_with("test_path")
    mock_git.get_upstream_branch.assert_called_with("test_path", "foo/bar")

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == upstream


@patch("jupyterlab_git.git.execute")
async def test_content(mock_execute, jp_fetch, jp_root_dir):
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
    response = await jp_fetch(NS, "content", body=json.dumps(body), method="POST")

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["content"] == content
    mock_execute.assert_has_calls(
        [
            call(
                ["git", "show", "{}:{}".format("previous", filename)],
                cwd=str(jp_root_dir / top_repo_path),
            ),
        ],
    )


@patch("jupyterlab_git.git.execute")
async def test_content_working(mock_execute, jp_fetch, jp_root_dir):
    # Given
    top_repo_path = "path/to/repo"
    filename = "my/file"
    content = "dummy content file\nwith multiple lines"

    mock_execute.side_effect = [
        maybe_future((0, content, "")),
    ]

    dummy_file = jp_root_dir / top_repo_path / Path(filename)
    dummy_file.parent.mkdir(parents=True)
    dummy_file.write_text(content)

    # When
    body = {
        "filename": filename,
        "reference": {"special": "WORKING"},
        "top_repo_path": top_repo_path,
    }
    response = await jp_fetch(NS, "content", body=json.dumps(body), method="POST")

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["content"] == content


@patch("jupyterlab_git.git.execute")
async def test_content_index(mock_execute, jp_fetch, jp_root_dir):
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
    response = await jp_fetch(NS, "content", body=json.dumps(body), method="POST")

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["content"] == content
    mock_execute.assert_has_calls(
        [
            call(
                ["git", "show", "{}:{}".format("", filename)],
                cwd=str(jp_root_dir / top_repo_path),
            ),
        ],
    )


@patch("jupyterlab_git.git.execute")
async def test_content_unknown_special(mock_execute, jp_fetch):
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

    with pytest.raises(tornado.httpclient.HTTPClientError) as e:
        await jp_fetch(NS, "content", body=json.dumps(body), method="POST")
    assert_http_error(e, 500, expected_message="unknown special ref")


@patch("jupyterlab_git.git.execute")
async def test_content_show_handled_error(mock_execute, jp_fetch):
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
    response = await jp_fetch(NS, "content", body=json.dumps(body), method="POST")

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["content"] == ""


@patch("jupyterlab_git.git.execute")
async def test_content_binary(mock_execute, jp_fetch):
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
    with pytest.raises(tornado.httpclient.HTTPClientError) as e:
        await jp_fetch(NS, "content", body=json.dumps(body), method="POST")
    assert_http_error(e, 500, expected_message="file is not UTF-8")


@patch("jupyterlab_git.git.execute")
async def test_content_show_unhandled_error(mock_execute, jp_fetch):
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
    with pytest.raises(tornado.httpclient.HTTPClientError) as e:
        await jp_fetch(NS, "content", body=json.dumps(body), method="POST")
    assert_http_error(e, 500, expected_message="Dummy error")


@patch("jupyterlab_git.git.execute")
async def test_content_getcontent_deleted_file(mock_execute, jp_fetch, jp_root_dir):
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
    response = await jp_fetch(NS, "content", body=json.dumps(body), method="POST")

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["content"] == ""
