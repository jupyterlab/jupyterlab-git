import json
from unittest.mock import ANY, MagicMock, Mock, call, patch

import pytest
import tornado

from jupyterlab_git.git import Git
from jupyterlab_git.handlers import NAMESPACE, setup_handlers, GitHandler

from .testutils import assert_http_error, maybe_future
from tornado.httpclient import HTTPClientError

from pathlib import Path


def test_mapping_added():
    mock_web_app = Mock()
    mock_web_app.settings = {"base_url": "nb_base_url"}
    setup_handlers(mock_web_app)

    mock_web_app.add_handlers.assert_called_once_with(".*", ANY)


@pytest.mark.parametrize(
    "path, with_cm", (("url", False), ("url/to/path", False), ("url/to/path", True))
)
def test_GitHandler_url2localpath(path, with_cm, jp_web_app, jp_root_dir):
    req = tornado.httputil.HTTPServerRequest()
    req.connection = MagicMock()
    handler = GitHandler(jp_web_app, req)
    if with_cm:
        assert (
            str(jp_root_dir / path),
            handler.contents_manager,
        ) == handler.url2localpath(path, with_cm)
    else:
        assert str(jp_root_dir / path) == handler.url2localpath(path, with_cm)


@patch("jupyterlab_git.handlers.GitAllHistoryHandler.git", spec=Git)
async def test_all_history_handler_localbranch(mock_git, jp_fetch, jp_root_dir):
    # Given
    show_top_level = {"code": 0, "path": "foo"}
    branch = "branch_foo"
    log = "log_foo"
    status = "status_foo"

    local_path = jp_root_dir / "test_path"

    mock_git.show_top_level.return_value = maybe_future(show_top_level)
    mock_git.branch.return_value = maybe_future(branch)
    mock_git.log.return_value = maybe_future(log)
    mock_git.status.return_value = maybe_future(status)

    # When
    body = {"history_count": 25}
    response = await jp_fetch(
        NAMESPACE, local_path.name, "all_history", body=json.dumps(body), method="POST"
    )

    # Then
    mock_git.show_top_level.assert_called_with(str(local_path))
    mock_git.branch.assert_called_with(str(local_path))
    mock_git.log.assert_called_with(str(local_path), 25)
    mock_git.status.assert_called_with(str(local_path))

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
async def test_git_show_prefix(mock_execute, jp_fetch, jp_root_dir):
    # Given
    path = "path/to/repo"

    local_path = jp_root_dir / "test_path"

    mock_execute.return_value = maybe_future((0, str(path), ""))

    # When
    response = await jp_fetch(
        NAMESPACE,
        local_path.name + "/subfolder",
        "show_prefix",
        body="{}",
        method="POST",
    )

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["path"] == str(path)
    mock_execute.assert_has_calls(
        [
            call(
                ["git", "rev-parse", "--show-prefix"],
                cwd=str(local_path / "subfolder"),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
        ]
    )


@patch("jupyterlab_git.git.execute")
async def test_git_show_prefix_nested_directory(mock_execute, jp_fetch, jp_root_dir):
    mock_execute.return_value = maybe_future((0, f"{jp_root_dir.name}/", ""))
    # When
    response = await jp_fetch(
        NAMESPACE,
        "show_prefix",
        body="{}",
        method="POST",
    )
    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["path"] is None
    mock_execute.assert_has_calls(
        [
            call(
                ["git", "rev-parse", "--show-prefix"],
                cwd=str(jp_root_dir) + "/",
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
        ]
    )


async def test_git_show_prefix_for_excluded_path(
    jp_fetch, jp_server_config, jp_root_dir
):
    local_path = jp_root_dir / "ignored-path"

    try:
        response = await jp_fetch(
            NAMESPACE,
            local_path.name + "/subdir",
            "show_prefix",
            body="{}",
            method="POST",
        )
    except HTTPClientError as e:
        assert e.code == 404


@patch("jupyterlab_git.git.execute")
async def test_git_show_prefix_not_a_git_repo(mock_execute, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"

    mock_execute.return_value = maybe_future(
        (128, "", "fatal: not a git repository (or any")
    )

    # When
    response = await jp_fetch(
        NAMESPACE,
        local_path.name + "/subfolder",
        "show_prefix",
        body="{}",
        method="POST",
    )

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["path"] is None
    mock_execute.assert_has_calls(
        [
            call(
                ["git", "rev-parse", "--show-prefix"],
                cwd=str(local_path / "subfolder"),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
        ]
    )


@patch("jupyterlab_git.git.execute")
async def test_git_show_top_level(mock_execute, jp_fetch, jp_root_dir):
    # Given
    path = "path/to/repo"

    local_path = jp_root_dir / "test_path"

    mock_execute.return_value = maybe_future((0, str(path), ""))

    # When
    response = await jp_fetch(
        NAMESPACE,
        local_path.name + "/subfolder",
        "show_top_level",
        body="{}",
        method="POST",
    )

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["path"] == str(path)
    mock_execute.assert_has_calls(
        [
            call(
                ["git", "rev-parse", "--show-toplevel"],
                cwd=str(local_path / "subfolder"),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
        ]
    )


@patch("jupyterlab_git.git.execute")
async def test_git_show_top_level_not_a_git_repo(mock_execute, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"

    mock_execute.return_value = maybe_future(
        (128, "", "fatal: not a git repository (or any")
    )

    # When
    response = await jp_fetch(
        NAMESPACE,
        local_path.name + "/subfolder",
        "show_top_level",
        body="{}",
        method="POST",
    )

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["path"] is None
    mock_execute.assert_has_calls(
        [
            call(
                ["git", "rev-parse", "--show-toplevel"],
                cwd=str(local_path / "subfolder"),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
        ]
    )


@patch("jupyterlab_git.handlers.GitBranchHandler.git", spec=Git)
async def test_branch_handler_localbranch(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
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
                "name": "main",
                "upstream": "origin/main",
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
                "name": "origin/main",
                "upstream": None,
                "top_commit": "abcdefghijklmnopqrstuvwxyz01234567890123",
                "tag": None,
            },
        ],
    }

    mock_git.branch.return_value = maybe_future(branch)

    # When
    response = await jp_fetch(
        NAMESPACE, local_path.name, "branch", body="{}", method="POST"
    )

    # Then
    mock_git.branch.assert_called_with(str(local_path))

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"code": 0, "branches": branch["branches"]}


@patch("jupyterlab_git.handlers.GitLogHandler.git", spec=Git)
async def test_log_handler(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    log = {"code": 0, "commits": []}
    mock_git.log.return_value = maybe_future(log)

    # When
    body = {"history_count": 20}
    response = await jp_fetch(
        NAMESPACE, local_path.name, "log", body=json.dumps(body), method="POST"
    )

    # Then
    mock_git.log.assert_called_with(str(local_path), 20, None)

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == log


@patch("jupyterlab_git.handlers.GitLogHandler.git", spec=Git)
async def test_log_handler_no_history_count(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    log = {"code": 0, "commits": []}
    mock_git.log.return_value = maybe_future(log)

    # When
    response = await jp_fetch(
        NAMESPACE, local_path.name, "log", body="{}", method="POST"
    )

    # Then
    mock_git.log.assert_called_with(str(local_path), 25, None)

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == log


@patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
async def test_push_handler_localbranch(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    mock_git.get_current_branch.return_value = maybe_future("localbranch")
    mock_git.get_upstream_branch.return_value = maybe_future(
        {"code": 0, "remote_short_name": ".", "remote_branch": "localbranch"}
    )
    mock_git.push.return_value = maybe_future({"code": 0})

    # When
    response = await jp_fetch(
        NAMESPACE, local_path.name, "push", body="{}", method="POST"
    )

    # Then
    mock_git.get_current_branch.assert_called_with(str(local_path))
    mock_git.get_upstream_branch.assert_called_with(str(local_path), "localbranch")
    mock_git.push.assert_called_with(
        ".", "HEAD:localbranch", str(local_path), None, False, False
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"code": 0}


@patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
async def test_push_handler_remotebranch(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    mock_git.get_current_branch.return_value = maybe_future("foo/bar")
    upstream = {
        "code": 0,
        "remote_short_name": "origin/something",
        "remote_branch": "remote-branch-name",
    }
    mock_git.get_upstream_branch.return_value = maybe_future(upstream)
    mock_git.push.return_value = maybe_future({"code": 0})

    # When
    response = await jp_fetch(
        NAMESPACE, local_path.name, "push", body="{}", method="POST"
    )

    # Then
    mock_git.get_current_branch.assert_called_with(str(local_path))
    mock_git.get_upstream_branch.assert_called_with(str(local_path), "foo/bar")
    mock_git.push.assert_called_with(
        "origin/something",
        "HEAD:remote-branch-name",
        str(local_path),
        None,
        False,
        False,
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"code": 0}


@patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
async def test_push_handler_noupstream(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
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

    # When
    with pytest.raises(tornado.httpclient.HTTPClientError) as e:
        await jp_fetch(NAMESPACE, local_path.name, "push", body="{}", method="POST")

    response = e.value.response

    # Then
    mock_git.get_current_branch.assert_called_with(str(local_path))
    mock_git.get_upstream_branch.assert_called_with(str(local_path), "foo")
    mock_git.config.assert_called_with(str(local_path))
    mock_git.remote_show.assert_called_with(str(local_path))
    mock_git.push.assert_not_called()

    assert response.code == 500
    payload = json.loads(response.body)
    assert payload == {
        "code": 128,
        "message": "fatal: The current branch foo has no upstream branch.",
        "remotes": list(),
    }


@patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
async def test_push_handler_multipleupstream(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    remotes = ["origin", "upstream"]
    mock_git.get_current_branch.return_value = maybe_future("foo")
    upstream = {"code": -1, "message": "oups"}
    mock_git.get_upstream_branch.return_value = maybe_future(upstream)
    mock_git.config.return_value = maybe_future({"options": dict()})
    mock_git.remote_show.return_value = maybe_future({"remotes": remotes})
    mock_git.push.return_value = maybe_future({"code": 0})

    # When
    with pytest.raises(tornado.httpclient.HTTPClientError) as e:
        await jp_fetch(NAMESPACE, local_path.name, "push", body="{}", method="POST")
    response = e.value.response

    # Then
    mock_git.get_current_branch.assert_called_with(str(local_path))
    mock_git.get_upstream_branch.assert_called_with(str(local_path), "foo")
    mock_git.config.assert_called_with(str(local_path))
    mock_git.remote_show.assert_called_with(str(local_path))
    mock_git.push.assert_not_called()

    assert response.code == 500
    payload = json.loads(response.body)
    assert payload == {
        "code": 128,
        "message": "fatal: The current branch foo has no upstream branch.",
        "remotes": remotes,
    }


@patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
async def test_push_handler_noupstream_unique_remote(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    remote = "origin"
    mock_git.get_current_branch.return_value = maybe_future("foo")
    upstream = {"code": -1, "message": "oups"}
    mock_git.get_upstream_branch.return_value = maybe_future(upstream)
    mock_git.config.return_value = maybe_future({"options": dict()})
    mock_git.remote_show.return_value = maybe_future({"remotes": [remote]})
    mock_git.push.return_value = maybe_future({"code": 0})

    # When
    response = await jp_fetch(
        NAMESPACE, local_path.name, "push", body="{}", method="POST"
    )

    # Then
    mock_git.get_current_branch.assert_called_with(str(local_path))
    mock_git.get_upstream_branch.assert_called_with(str(local_path), "foo")
    mock_git.config.assert_called_with(str(local_path))
    mock_git.remote_show.assert_called_with(str(local_path))
    mock_git.push.assert_called_with(
        remote,
        "foo",
        str(local_path),
        None,
        set_upstream=True,
        force=False,
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"code": 0}


@patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
async def test_push_handler_noupstream_pushdefault(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    remote = "rorigin"
    mock_git.get_current_branch.return_value = maybe_future("foo")
    upstream = {"code": -1, "message": "oups"}
    mock_git.get_upstream_branch.return_value = maybe_future(upstream)
    mock_git.config.return_value = maybe_future(
        {"options": {"remote.pushdefault": remote}}
    )
    mock_git.remote_show.return_value = maybe_future({"remotes": [remote, "upstream"]})
    mock_git.push.return_value = maybe_future({"code": 0})

    # When
    response = await jp_fetch(
        NAMESPACE, local_path.name, "push", body="{}", method="POST"
    )

    # Then
    mock_git.get_current_branch.assert_called_with(str(local_path))
    mock_git.get_upstream_branch.assert_called_with(str(local_path), "foo")
    mock_git.config.assert_called_with(str(local_path))
    mock_git.remote_show.assert_called_with(str(local_path))
    mock_git.push.assert_called_with(
        remote,
        "foo",
        str(local_path),
        None,
        set_upstream=True,
        force=False,
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"code": 0}


@patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
async def test_push_handler_noupstream_pass_remote_nobranch(
    mock_git, jp_fetch, jp_root_dir
):
    # Given
    local_path = jp_root_dir / "test_path"
    mock_git.get_current_branch.return_value = maybe_future("foo")
    upstream = {"code": -1, "message": "oups"}
    mock_git.get_upstream_branch.return_value = maybe_future(upstream)
    mock_git.config.return_value = maybe_future({"options": dict()})
    mock_git.remote_show.return_value = maybe_future({})
    mock_git.push.return_value = maybe_future({"code": 0})

    remote = "online"

    # When
    body = {"remote": remote}
    response = await jp_fetch(
        NAMESPACE, local_path.name, "push", body=json.dumps(body), method="POST"
    )

    # Then
    mock_git.get_current_branch.assert_called_with(str(local_path))
    mock_git.get_upstream_branch.assert_called_with(str(local_path), "foo")
    mock_git.config.assert_not_called()
    mock_git.remote_show.assert_not_called()
    mock_git.push.assert_called_with(
        remote, "HEAD:foo", str(local_path), None, True, False
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"code": 0}


@patch("jupyterlab_git.handlers.GitPushHandler.git", spec=Git)
async def test_push_handler_noupstream_pass_remote_branch(
    mock_git, jp_fetch, jp_root_dir
):
    # Given
    local_path = jp_root_dir / "test_path"
    mock_git.get_current_branch.return_value = maybe_future("foo")
    upstream = {"code": -1, "message": "oups"}
    mock_git.get_upstream_branch.return_value = maybe_future(upstream)
    mock_git.config.return_value = maybe_future({"options": dict()})
    mock_git.remote_show.return_value = maybe_future({})
    mock_git.push.return_value = maybe_future({"code": 0})

    remote = "online"
    remote_branch = "onfoo"

    # When
    body = {"remote": "/".join((remote, remote_branch))}
    response = await jp_fetch(
        NAMESPACE, local_path.name, "push", body=json.dumps(body), method="POST"
    )

    # Then
    mock_git.get_current_branch.assert_called_with(str(local_path))
    mock_git.get_upstream_branch.assert_called_with(str(local_path), "foo")
    mock_git.config.assert_not_called()
    mock_git.remote_show.assert_not_called()
    mock_git.push.assert_called_with(
        remote, "HEAD:" + remote_branch, str(local_path), None, True, False
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"code": 0}


@patch("jupyterlab_git.handlers.GitUpstreamHandler.git", spec=Git)
async def test_upstream_handler_forward_slashes(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    mock_git.get_current_branch.return_value = maybe_future("foo/bar")
    upstream = {
        "code": 0,
        "remote_short_name": "origin/something",
        "remote_branch": "foo/bar",
    }
    mock_git.get_upstream_branch.return_value = maybe_future(upstream)

    # When
    response = await jp_fetch(
        NAMESPACE, local_path.name, "upstream", body="{}", method="POST"
    )

    # Then
    mock_git.get_current_branch.assert_called_with(str(local_path))
    mock_git.get_upstream_branch.assert_called_with(str(local_path), "foo/bar")

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == upstream


@patch("jupyterlab_git.handlers.GitUpstreamHandler.git", spec=Git)
async def test_upstream_handler_localbranch(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    mock_git.get_current_branch.return_value = maybe_future("foo/bar")
    upstream = {"code": 0, "remote_short_name": ".", "remote_branch": "foo/bar"}
    mock_git.get_upstream_branch.return_value = maybe_future(upstream)

    # When
    response = await jp_fetch(
        NAMESPACE, local_path.name, "upstream", body="{}", method="POST"
    )

    # Then
    mock_git.get_current_branch.assert_called_with(str(local_path))
    mock_git.get_upstream_branch.assert_called_with(str(local_path), "foo/bar")

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == upstream


@patch("jupyterlab_git.git.execute")
async def test_content(mock_execute, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
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
    }
    response = await jp_fetch(
        NAMESPACE, local_path.name, "content", body=json.dumps(body), method="POST"
    )

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["content"] == content
    mock_execute.assert_has_calls(
        [
            call(
                [
                    "git",
                    "diff",
                    "--numstat",
                    "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
                    "previous",
                    "--",
                    filename,
                ],
                cwd=str(local_path),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
            call(
                ["git", "show", "{}:{}".format("previous", filename)],
                cwd=str(local_path),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
        ]
    )


async def test_content_working(jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    filename = "my/file"
    content = "dummy content file\nwith multiple lines"

    dummy_file = local_path / filename
    dummy_file.parent.mkdir(parents=True)
    dummy_file.write_text(content)

    # When
    body = {
        "filename": filename,
        "reference": {"special": "WORKING"},
    }
    response = await jp_fetch(
        NAMESPACE, local_path.name, "content", body=json.dumps(body), method="POST"
    )

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["content"] == content


async def test_content_notebook_working(jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    filename = "my/notebook.ipynb"
    content = """{
 "cells": [],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "mimetype": "text/x-python",
   "name": "python"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 5
}
"""

    dummy_file = local_path / filename
    dummy_file.parent.mkdir(parents=True)
    dummy_file.write_text(content)

    # When
    body = {
        "filename": filename,
        "reference": {"special": "WORKING"},
    }
    response = await jp_fetch(
        NAMESPACE, local_path.name, "content", body=json.dumps(body), method="POST"
    )

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["content"] == content


@patch("jupyterlab_git.git.execute")
async def test_content_index(mock_execute, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
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
    }
    response = await jp_fetch(
        NAMESPACE, local_path.name, "content", body=json.dumps(body), method="POST"
    )

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["content"] == content
    mock_execute.assert_has_calls(
        [
            call(
                [
                    "git",
                    "diff",
                    "--numstat",
                    "--cached",
                    "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
                    "--",
                    filename,
                ],
                cwd=str(local_path),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
            call(
                ["git", "show", "{}:{}".format("", filename)],
                cwd=str(local_path),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
        ],
    )


@patch("jupyterlab_git.git.execute")
async def test_content_base(mock_execute, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    filename = "my/file"
    content = "dummy content file\nwith multiple lines"
    obj_ref = "915bb14609daab65e5304e59d89c626283ae49fc"

    mock_execute.side_effect = [
        maybe_future(
            (
                0,
                "100644 {1} 1       {0}\x00100644 285bdbc14e499b85ec407512a3bb3992fa3d4082 2 {0}\x00100644 66ac842dfb0b5c20f757111d6b3edd56d80622b4 3 {0}\x00".format(
                    filename, obj_ref
                ),
                "",
            )
        ),
        maybe_future((0, content, "")),
    ]

    # When
    body = {
        "filename": filename,
        "reference": {"special": "BASE"},
    }
    response = await jp_fetch(
        NAMESPACE, local_path.name, "content", body=json.dumps(body), method="POST"
    )

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["content"] == content
    mock_execute.assert_has_calls(
        [
            call(
                ["git", "ls-files", "-u", "-z", filename],
                cwd=str(local_path),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
            call(
                ["git", "show", "915bb14609daab65e5304e59d89c626283ae49fc"],
                cwd=str(local_path),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
        ]
    )


@patch("jupyterlab_git.git.execute")
async def test_content_unknown_special(mock_execute, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
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
    }

    with pytest.raises(tornado.httpclient.HTTPClientError) as e:
        await jp_fetch(
            NAMESPACE, local_path.name, "content", body=json.dumps(body), method="POST"
        )
    assert_http_error(e, 500, expected_message="unknown special ref")


@patch("jupyterlab_git.git.execute")
async def test_content_show_handled_error(mock_execute, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
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
    }
    response = await jp_fetch(
        NAMESPACE, local_path.name, "content", body=json.dumps(body), method="POST"
    )

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["content"] == ""


@patch("jupyterlab_git.git.execute")
async def test_content_binary(mock_execute, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    filename = "my/file"

    mock_execute.return_value = maybe_future((0, "-\t-\t{}".format(filename), ""))

    # When
    body = {
        "filename": filename,
        "reference": {"git": "current"},
    }

    # Then
    response = await jp_fetch(
        NAMESPACE, local_path.name, "content", body=json.dumps(body), method="POST"
    )

    mock_execute.assert_has_calls(
        [
            call(
                [
                    "git",
                    "diff",
                    "--numstat",
                    "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
                    "current",
                    "--",
                    filename,
                ],
                cwd=str(local_path),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
            call(
                ["git", "show", "{}:{}".format("current", filename)],
                cwd=str(local_path),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=True,
            ),
        ]
    )


@patch("jupyterlab_git.git.execute")
async def test_content_show_unhandled_error(mock_execute, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    filename = "my/file"

    mock_execute.return_value = maybe_future((-1, "", "Dummy error"))

    # When
    body = {
        "filename": filename,
        "reference": {"git": "current"},
    }

    # Then
    with pytest.raises(tornado.httpclient.HTTPClientError) as e:
        await jp_fetch(
            NAMESPACE, local_path.name, "content", body=json.dumps(body), method="POST"
        )
    assert_http_error(e, 500, expected_message="Dummy error")


@patch("jupyterlab_git.git.execute")
async def test_content_getcontent_deleted_file(mock_execute, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    filename = "my/absent_file"
    content = "dummy content file\nwith multiple lines"

    # When
    body = {
        "filename": filename,
        "reference": {"special": "WORKING"},
    }
    # Then
    response = await jp_fetch(
        NAMESPACE, local_path.name, "content", body=json.dumps(body), method="POST"
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["content"] == ""
