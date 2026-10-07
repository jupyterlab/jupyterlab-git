import json
import os
from unittest.mock import patch

import pytest

from jupyterlab_git_core.git import Git
from jupyterlab_git.handlers import NAMESPACE

from .testutils import assert_http_error
from tornado.httpclient import HTTPClientError


def worktree(path, **kwargs):
    """Build a worktree entry as returned by ``Git.worktree_list``."""
    entry = {
        "path": path,
        "head": "abcdefghijklmnopqrstuvwxyz01234567890123",
        "branch": "main",
        "detached": False,
        "bare": False,
        "locked": False,
        "prunable": False,
        "is_main": False,
        "is_current": False,
    }
    entry.update(kwargs)
    return entry


@patch("jupyterlab_git.handlers.GitWorktreeHandler.git", spec=Git)
async def test_worktrees_get(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    root_real = os.path.realpath(str(jp_root_dir))
    main_abs = os.path.join(root_real, "test_path")
    linked_abs = os.path.join(root_real, "test_path", ".worktrees", "feature")
    outside_abs = os.path.join(os.path.dirname(root_real), "outside-wt")

    mock_git.worktree_list.return_value = {
        "code": 0,
        "worktrees": [
            worktree(main_abs, is_main=True, is_current=True),
            worktree(linked_abs, branch="feature"),
            worktree(outside_abs, branch="outside"),
        ],
    }

    # When
    response = await jp_fetch(NAMESPACE, local_path.name, "worktrees", method="GET")

    # Then
    mock_git.worktree_list.assert_called_with(str(local_path))

    assert response.code == 200
    payload = json.loads(response.body)
    assert [entry["path"] for entry in payload["worktrees"]] == [
        "test_path",
        "test_path/.worktrees/feature",
        "../outside-wt",
    ]


@patch("jupyterlab_git.handlers.GitWorktreeHandler.git", spec=Git)
async def test_worktrees_get_failure(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    mock_git.worktree_list.return_value = {
        "code": 128,
        "command": "git worktree list --porcelain",
        "message": "fatal: not a git repository",
    }

    # When
    with pytest.raises(HTTPClientError) as error:
        await jp_fetch(NAMESPACE, local_path.name, "worktrees", method="GET")

    # Then
    assert_http_error(error, 500)


@patch("jupyterlab_git.handlers.GitWorktreeHandler.git", spec=Git)
async def test_worktrees_post(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    mock_git.worktree_add.return_value = {"code": 0, "message": ""}

    body = {
        "worktree_path": ".worktrees/feature",
        "branch": "feature",
        "new_branch": True,
        "start_point": "main",
    }

    # When
    response = await jp_fetch(
        NAMESPACE,
        local_path.name,
        "worktrees",
        body=json.dumps(body),
        method="POST",
    )

    # Then
    expected_destination = os.path.realpath(str(local_path / ".worktrees" / "feature"))
    mock_git.worktree_add.assert_called_with(
        str(local_path),
        expected_destination,
        "feature",
        new_branch=True,
        start_point="main",
    )

    assert response.code == 201
    payload = json.loads(response.body)
    assert payload["worktree_path"] == "test_path/.worktrees/feature"


@patch("jupyterlab_git.handlers.GitWorktreeHandler.git", spec=Git)
async def test_worktrees_post_outside_root_rejected(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    body = {"worktree_path": "../../outside", "branch": "feature"}

    # When
    with pytest.raises(HTTPClientError) as error:
        await jp_fetch(
            NAMESPACE,
            local_path.name,
            "worktrees",
            body=json.dumps(body),
            method="POST",
        )

    # Then
    assert_http_error(error, 400)
    mock_git.worktree_add.assert_not_called()


@patch("jupyterlab_git.handlers.GitWorktreeHandler.git", spec=Git)
async def test_worktrees_post_missing_branch_rejected(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    body = {"worktree_path": ".worktrees/feature"}

    # When
    with pytest.raises(HTTPClientError) as error:
        await jp_fetch(
            NAMESPACE,
            local_path.name,
            "worktrees",
            body=json.dumps(body),
            method="POST",
        )

    # Then
    assert_http_error(error, 400)
    mock_git.worktree_add.assert_not_called()


@patch("jupyterlab_git.handlers.GitWorktreeHandler.git", spec=Git)
async def test_worktrees_post_failure(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    mock_git.worktree_add.return_value = {
        "code": 128,
        "command": "git worktree add",
        "message": "fatal: 'feature' is already used by worktree at '/wt'",
    }
    body = {"worktree_path": ".worktrees/feature", "branch": "feature"}

    # When
    with pytest.raises(HTTPClientError) as error:
        await jp_fetch(
            NAMESPACE,
            local_path.name,
            "worktrees",
            body=json.dumps(body),
            method="POST",
        )

    # Then
    assert_http_error(error, 500)


@patch("jupyterlab_git.handlers.GitWorktreeHandler.git", spec=Git)
async def test_worktrees_delete(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    mock_git.worktree_remove.return_value = {"code": 0, "message": ""}

    # When
    response = await jp_fetch(
        NAMESPACE,
        local_path.name,
        "worktrees",
        method="DELETE",
        params={"worktree_path": "test_path/.worktrees/feature"},
    )

    # Then
    expected_target = os.path.realpath(str(local_path / ".worktrees" / "feature"))
    mock_git.worktree_remove.assert_called_with(str(local_path), expected_target, False)
    assert response.code == 204


@patch("jupyterlab_git.handlers.GitWorktreeHandler.git", spec=Git)
async def test_worktrees_delete_force(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    mock_git.worktree_remove.return_value = {"code": 0, "message": ""}

    # When
    response = await jp_fetch(
        NAMESPACE,
        local_path.name,
        "worktrees",
        method="DELETE",
        params={
            "worktree_path": "test_path/.worktrees/feature",
            "force": "true",
        },
    )

    # Then
    expected_target = os.path.realpath(str(local_path / ".worktrees" / "feature"))
    mock_git.worktree_remove.assert_called_with(str(local_path), expected_target, True)
    assert response.code == 204


@patch("jupyterlab_git.handlers.GitWorktreeHandler.git", spec=Git)
async def test_worktrees_delete_outside_root_rejected(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"

    # When
    with pytest.raises(HTTPClientError) as error:
        await jp_fetch(
            NAMESPACE,
            local_path.name,
            "worktrees",
            method="DELETE",
            params={"worktree_path": "../outside-wt"},
        )

    # Then
    assert_http_error(error, 400)
    mock_git.worktree_remove.assert_not_called()


@patch("jupyterlab_git.handlers.GitWorktreeHandler.git", spec=Git)
async def test_worktrees_delete_failure(mock_git, jp_fetch, jp_root_dir):
    # Given
    local_path = jp_root_dir / "test_path"
    mock_git.worktree_remove.return_value = {
        "code": 128,
        "command": "git worktree remove",
        "message": "fatal: validation failed",
    }

    # When
    with pytest.raises(HTTPClientError) as error:
        await jp_fetch(
            NAMESPACE,
            local_path.name,
            "worktrees",
            method="DELETE",
            params={"worktree_path": "test_path/.worktrees/feature"},
        )

    # Then
    assert_http_error(error, 500)
