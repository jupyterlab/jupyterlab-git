import os
from pathlib import Path
from unittest.mock import patch

import pytest

from jupyterlab_git_core.git import Git, get_index_lock_path


@pytest.mark.asyncio
async def test_worktree_list_success(tmp_path):
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        main_path = tmp_path / "repo"
        main_path.mkdir()
        linked_path = tmp_path / "repo" / ".worktrees" / "feature"
        detached_path = tmp_path / "wt-detached"
        locked_path = tmp_path / "wt-locked"
        prunable_path = tmp_path / "wt-prunable"

        process_output = [
            "worktree {}".format(main_path),
            "HEAD abcdefghijklmnopqrstuvwxyz01234567890123",
            "branch refs/heads/main",
            "",
            "worktree {}".format(linked_path),
            "HEAD abcdefghijklmnopqrstuvwxyz01234567890123",
            "branch refs/heads/feature",
            "",
            "worktree {}".format(detached_path),
            "HEAD 01234567899999abcdefghijklmnopqrstuvwxyz",
            "detached",
            "",
            "worktree {}".format(locked_path),
            "HEAD abcdefghijklmnopqrstuvwxyz01234567890123",
            "branch refs/heads/locked-branch",
            "locked test lock reason",
            "",
            "worktree {}".format(prunable_path),
            "HEAD abcdefghijklmnopqrstuvwxyz01234567890123",
            "branch refs/heads/prunable-branch",
            "prunable gitdir file points to non-existent location",
            "",
        ]
        mock_execute.side_effect = [
            # Response for git worktree list
            (0, "\n".join(process_output), ""),
            # Response for git rev-parse --git-common-dir, triggered by the
            # exclusion of the nested worktree
            (0, ".git", ""),
        ]

        # When
        actual_response = await Git().worktree_list(path=str(main_path))

        # Then
        assert mock_execute.call_args_list[0].args[0] == [
            "git",
            "worktree",
            "list",
            "--porcelain",
        ]

        # The worktree nested inside the working tree is excluded from its
        # status, even though it was not created through the extension
        exclude_file = main_path / ".git" / "info" / "exclude"
        assert exclude_file.read_text() == "/.worktrees/feature/\n"
        assert actual_response == {
            "code": 0,
            "worktrees": [
                {
                    "path": str(main_path),
                    "head": "abcdefghijklmnopqrstuvwxyz01234567890123",
                    "branch": "main",
                    "detached": False,
                    "bare": False,
                    "locked": False,
                    "prunable": False,
                    "is_main": True,
                    "is_current": True,
                },
                {
                    "path": str(linked_path),
                    "head": "abcdefghijklmnopqrstuvwxyz01234567890123",
                    "branch": "feature",
                    "detached": False,
                    "bare": False,
                    "locked": False,
                    "prunable": False,
                    "is_main": False,
                    "is_current": False,
                },
                {
                    "path": str(detached_path),
                    "head": "01234567899999abcdefghijklmnopqrstuvwxyz",
                    "branch": None,
                    "detached": True,
                    "bare": False,
                    "locked": False,
                    "prunable": False,
                    "is_main": False,
                    "is_current": False,
                },
                {
                    "path": str(locked_path),
                    "head": "abcdefghijklmnopqrstuvwxyz01234567890123",
                    "branch": "locked-branch",
                    "detached": False,
                    "bare": False,
                    "locked": True,
                    "prunable": False,
                    "is_main": False,
                    "is_current": False,
                },
                {
                    "path": str(prunable_path),
                    "head": "abcdefghijklmnopqrstuvwxyz01234567890123",
                    "branch": "prunable-branch",
                    "detached": False,
                    "bare": False,
                    "locked": False,
                    "prunable": True,
                    "is_main": False,
                    "is_current": False,
                },
            ],
        }


@pytest.mark.asyncio
async def test_worktree_list_bare_repository(tmp_path):
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        bare_path = tmp_path / "repo.git"
        linked_path = tmp_path / "wt-main"

        process_output = [
            "worktree {}".format(bare_path),
            "bare",
            "",
            "worktree {}".format(linked_path),
            "HEAD abcdefghijklmnopqrstuvwxyz01234567890123",
            "branch refs/heads/main",
            "",
        ]
        mock_execute.return_value = (0, "\n".join(process_output), "")

        # When
        actual_response = await Git().worktree_list(path=str(linked_path))

        # Then
        assert actual_response == {
            "code": 0,
            "worktrees": [
                {
                    "path": str(bare_path),
                    "head": None,
                    "branch": None,
                    "detached": False,
                    "bare": True,
                    "locked": False,
                    "prunable": False,
                    "is_main": True,
                    "is_current": False,
                },
                {
                    "path": str(linked_path),
                    "head": "abcdefghijklmnopqrstuvwxyz01234567890123",
                    "branch": "main",
                    "detached": False,
                    "bare": False,
                    "locked": False,
                    "prunable": False,
                    "is_main": False,
                    "is_current": True,
                },
            ],
        }


@pytest.mark.asyncio
async def test_worktree_list_sibling_worktrees_write_no_exclude(tmp_path):
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        main_path = tmp_path / "repo"
        main_path.mkdir()
        sibling_path = tmp_path / "repo-feature"

        process_output = [
            "worktree {}".format(main_path),
            "HEAD abcdefghijklmnopqrstuvwxyz01234567890123",
            "branch refs/heads/main",
            "",
            "worktree {}".format(sibling_path),
            "HEAD abcdefghijklmnopqrstuvwxyz01234567890123",
            "branch refs/heads/feature",
            "",
        ]
        mock_execute.return_value = (0, "\n".join(process_output), "")

        # When
        actual_response = await Git().worktree_list(path=str(main_path))

        # Then
        assert actual_response["code"] == 0
        # A single call: the sibling worktree needs no exclude entry
        mock_execute.assert_called_once()
        assert not (main_path / ".git" / "info" / "exclude").exists()


@pytest.mark.asyncio
async def test_worktree_list_failure():
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        error_message = (
            "fatal: not a git repository (or any of the parent directories): .git"
        )
        mock_execute.return_value = (128, "", error_message)

        # When
        actual_response = await Git().worktree_list(
            path=str(Path("/bin/test_curr_path"))
        )

        # Then
        assert actual_response == {
            "code": 128,
            "command": "git worktree list --porcelain",
            "message": error_message,
        }


@pytest.mark.asyncio
async def test_worktree_add_existing_branch(tmp_path):
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        repo_path = tmp_path / "repo"
        worktree_path = tmp_path / "wt-feature"
        mock_execute.side_effect = [
            (0, "", "Preparing worktree (checking out 'feature')"),
        ]

        # When
        actual_response = await Git().worktree_add(
            path=str(repo_path),
            worktree_path=str(worktree_path),
            branch="feature",
        )

        # Then
        mock_execute.assert_called_once_with(
            ["git", "worktree", "add", str(worktree_path), "feature"],
            cwd=str(repo_path),
            env=None,
            username=None,
            password=None,
            is_binary=False,
        )
        assert actual_response == {
            "code": 0,
            "message": "Preparing worktree (checking out 'feature')",
        }


@pytest.mark.asyncio
async def test_worktree_add_new_branch_with_start_point(tmp_path):
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        repo_path = tmp_path / "repo"
        worktree_path = repo_path / ".worktrees" / "feature"
        repo_path.mkdir()
        mock_execute.side_effect = [
            # Response for git worktree add
            (0, "", "Preparing worktree (new branch 'feature')"),
            # Response for git rev-parse --git-common-dir
            (0, ".git", ""),
        ]

        # When
        actual_response = await Git().worktree_add(
            path=str(repo_path),
            worktree_path=str(worktree_path),
            branch="feature",
            new_branch=True,
            start_point="main",
        )

        # Then
        assert mock_execute.call_args_list[0].args[0] == [
            "git",
            "worktree",
            "add",
            "-b",
            "feature",
            str(worktree_path),
            "main",
        ]
        assert actual_response == {
            "code": 0,
            "message": "Preparing worktree (new branch 'feature')",
        }

        # The nested worktree is excluded from the repository status
        exclude_file = repo_path / ".git" / "info" / "exclude"
        assert exclude_file.read_text() == "/.worktrees/feature/\n"


@pytest.mark.asyncio
async def test_worktree_add_outside_repository_writes_no_exclude(tmp_path):
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        repo_path = tmp_path / "repo"
        worktree_path = tmp_path / "wt-feature"
        repo_path.mkdir()
        mock_execute.side_effect = [
            (0, "", "Preparing worktree (checking out 'feature')"),
        ]

        # When
        actual_response = await Git().worktree_add(
            path=str(repo_path),
            worktree_path=str(worktree_path),
            branch="feature",
        )

        # Then
        assert actual_response["code"] == 0
        # A single call: the sibling worktree needs no exclude entry
        mock_execute.assert_called_once()
        assert not (repo_path / ".git" / "info" / "exclude").exists()


@pytest.mark.asyncio
async def test_worktree_add_appends_to_existing_exclude(tmp_path):
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        repo_path = tmp_path / "repo"
        worktree_path = repo_path / ".worktrees" / "feature"
        exclude_file = repo_path / ".git" / "info" / "exclude"
        exclude_file.parent.mkdir(parents=True)
        exclude_file.write_text("*.log")
        mock_execute.side_effect = [
            (0, "", "Preparing worktree (checking out 'feature')"),
            (0, str(repo_path / ".git"), ""),
        ]

        # When
        await Git().worktree_add(
            path=str(repo_path),
            worktree_path=str(worktree_path),
            branch="feature",
        )

        # Then
        assert exclude_file.read_text() == "*.log\n/.worktrees/feature/\n"


@pytest.mark.asyncio
async def test_worktree_add_exclude_entry_not_duplicated(tmp_path):
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        repo_path = tmp_path / "repo"
        worktree_path = repo_path / ".worktrees" / "feature"
        exclude_file = repo_path / ".git" / "info" / "exclude"
        exclude_file.parent.mkdir(parents=True)
        exclude_file.write_text("/.worktrees/feature/\n")
        mock_execute.side_effect = [
            (0, "", "Preparing worktree (checking out 'feature')"),
            (0, str(repo_path / ".git"), ""),
        ]

        # When
        await Git().worktree_add(
            path=str(repo_path),
            worktree_path=str(worktree_path),
            branch="feature",
        )

        # Then
        assert exclude_file.read_text() == "/.worktrees/feature/\n"


@pytest.mark.asyncio
async def test_worktree_add_failure(tmp_path):
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        repo_path = tmp_path / "repo"
        worktree_path = tmp_path / "wt-feature"
        error_message = "fatal: 'feature' is already used by worktree at '/existing/wt'"
        mock_execute.return_value = (128, "", error_message)

        # When
        actual_response = await Git().worktree_add(
            path=str(repo_path),
            worktree_path=str(worktree_path),
            branch="feature",
        )

        # Then
        assert actual_response == {
            "code": 128,
            "command": "git worktree add {} feature".format(worktree_path),
            "message": error_message,
        }


@pytest.mark.asyncio
async def test_worktree_remove_success():
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = (0, "", "")

        # When
        actual_response = await Git().worktree_remove(
            path=str(Path("/bin/test_curr_path")),
            worktree_path=str(Path("/bin/wt-feature")),
        )

        # Then
        mock_execute.assert_called_once_with(
            ["git", "worktree", "remove", str(Path("/bin/wt-feature"))],
            cwd=str(Path("/bin/test_curr_path")),
            env=None,
            username=None,
            password=None,
            is_binary=False,
        )
        assert actual_response == {"code": 0, "message": ""}


@pytest.mark.asyncio
async def test_worktree_remove_force():
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = (0, "", "")

        # When
        actual_response = await Git().worktree_remove(
            path=str(Path("/bin/test_curr_path")),
            worktree_path=str(Path("/bin/wt-feature")),
            force=True,
        )

        # Then
        mock_execute.assert_called_once_with(
            [
                "git",
                "worktree",
                "remove",
                "--force",
                "--force",
                str(Path("/bin/wt-feature")),
            ],
            cwd=str(Path("/bin/test_curr_path")),
            env=None,
            username=None,
            password=None,
            is_binary=False,
        )
        assert actual_response == {"code": 0, "message": ""}


@pytest.mark.asyncio
async def test_worktree_remove_failure():
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        error_message = (
            "fatal: '/bin/wt-feature' contains modified or untracked files,"
            " use --force to delete it"
        )
        mock_execute.return_value = (128, "", error_message)

        # When
        actual_response = await Git().worktree_remove(
            path=str(Path("/bin/test_curr_path")),
            worktree_path="/bin/wt-feature",
        )

        # Then
        assert actual_response == {
            "code": 128,
            "command": "git worktree remove /bin/wt-feature",
            "message": error_message,
        }


def test_get_index_lock_path_main_worktree(tmp_path):
    # Given a repository whose .git is a directory
    git_dir = tmp_path / ".git"
    git_dir.mkdir()

    # Then
    assert get_index_lock_path(str(tmp_path)) == str(git_dir / "index.lock")


def test_get_index_lock_path_linked_worktree_absolute(tmp_path):
    # Given a linked worktree whose .git is a file with an absolute gitdir
    main_git_dir = tmp_path / "repo" / ".git" / "worktrees" / "wt"
    main_git_dir.mkdir(parents=True)
    worktree = tmp_path / "wt"
    worktree.mkdir()
    (worktree / ".git").write_text("gitdir: {}\n".format(main_git_dir))

    # Then
    assert get_index_lock_path(str(worktree)) == str(main_git_dir / "index.lock")


def test_get_index_lock_path_linked_worktree_relative(tmp_path):
    # Given a submodule-style .git file with a relative gitdir
    worktree = tmp_path / "sub"
    worktree.mkdir()
    (worktree / ".git").write_text("gitdir: ../.git/modules/sub\n")

    # Then
    assert get_index_lock_path(str(worktree)) == os.path.join(
        str(worktree), "../.git/modules/sub", "index.lock"
    )


def test_get_index_lock_path_no_repository(tmp_path):
    # Given a folder without any .git entry
    assert get_index_lock_path(str(tmp_path)) == str(tmp_path / ".git" / "index.lock")
