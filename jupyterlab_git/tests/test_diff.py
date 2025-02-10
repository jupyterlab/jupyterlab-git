import json
import nbformat
from pathlib import Path
from subprocess import CalledProcessError
from unittest.mock import patch

import pytest
import tornado

from jupyterlab_git.git import Git

from .testutils import maybe_future


@pytest.mark.asyncio
async def test_changed_files_invalid_input():
    with pytest.raises(tornado.web.HTTPError):
        await Git().changed_files(
            path="test-path", base="64950a634cd11d1a01ddfedaeffed67b531cb11e"
        )


@pytest.mark.asyncio
async def test_changed_files_single_commit():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = maybe_future((0, "file1.ipynb\x00file2.py\x00", ""))

        # When
        actual_response = await Git().changed_files(
            path="test-path",
            single_commit="64950a634cd11d1a01ddfedaeffed67b531cb11e^!",
        )

        # Then
        mock_execute.assert_called_once_with(
            [
                "git",
                "diff",
                "64950a634cd11d1a01ddfedaeffed67b531cb11e^!",
                "--name-only",
                "-z",
            ],
            cwd="test-path",
            timeout=20,
            env=None,
            username=None,
            password=None,
            is_binary=False,
        )
        assert {"code": 0, "files": ["file1.ipynb", "file2.py"]} == actual_response


@pytest.mark.asyncio
async def test_changed_files_working_tree():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = maybe_future((0, "file1.ipynb\x00file2.py", ""))

        # When
        actual_response = await Git().changed_files(
            path="test-path", base="WORKING", remote="HEAD"
        )

        # Then
        mock_execute.assert_called_once_with(
            ["git", "diff", "HEAD", "--name-only", "-z"],
            cwd="test-path",
            timeout=20,
            env=None,
            username=None,
            password=None,
            is_binary=False,
        )
        assert {"code": 0, "files": ["file1.ipynb", "file2.py"]} == actual_response


@pytest.mark.asyncio
async def test_changed_files_index():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = maybe_future((0, "file1.ipynb\x00file2.py", ""))

        # When
        actual_response = await Git().changed_files(
            path="test-path", base="INDEX", remote="HEAD"
        )

        # Then
        mock_execute.assert_called_once_with(
            ["git", "diff", "--staged", "HEAD", "--name-only", "-z"],
            cwd="test-path",
            timeout=20,
            env=None,
            username=None,
            password=None,
            is_binary=False,
        )
        assert {"code": 0, "files": ["file1.ipynb", "file2.py"]} == actual_response


@pytest.mark.asyncio
async def test_changed_files_two_commits():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = maybe_future((0, "file1.ipynb\x00file2.py", ""))

        # When
        actual_response = await Git().changed_files(
            path="test-path", base="HEAD", remote="origin/HEAD"
        )

        # Then
        mock_execute.assert_called_once_with(
            ["git", "diff", "HEAD", "origin/HEAD", "--name-only", "-z", "--"],
            cwd="test-path",
            timeout=20,
            env=None,
            username=None,
            password=None,
            is_binary=False,
        )
        assert {"code": 0, "files": ["file1.ipynb", "file2.py"]} == actual_response


@pytest.mark.asyncio
async def test_changed_files_git_diff_error():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.side_effect = CalledProcessError(128, b"cmd", b"error message")

        # When
        actual_response = await Git().changed_files(
            path="test-path", base="HEAD", remote="origin/HEAD"
        )

        # Then
        mock_execute.assert_called_once_with(
            ["git", "diff", "HEAD", "origin/HEAD", "--name-only", "-z", "--"],
            cwd="test-path",
            timeout=20,
            env=None,
            username=None,
            password=None,
            is_binary=False,
        )
        assert {"code": 128, "message": "error message"} == actual_response


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "args, cli_result, cmd, expected",
    [
        (
            ("dummy.txt", "ar539ie5", "/bin"),
            (0, "2\t1\tdummy.txt", ""),
            [
                "git",
                "diff",
                "--numstat",
                "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
                "ar539ie5",
                "--",
                "dummy.txt",
            ],
            False,
        ),
        (
            ("dummy.png", "ar539ie5", "/bin"),
            (0, "-\t-\tdummy.png", ""),
            [
                "git",
                "diff",
                "--numstat",
                "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
                "ar539ie5",
                "--",
                "dummy.png",
            ],
            True,
        ),
        (
            ("dummy.txt", "INDEX", "/bin"),
            (0, "2\t1\tdummy.txt", ""),
            [
                "git",
                "diff",
                "--numstat",
                "--cached",
                "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
                "--",
                "dummy.txt",
            ],
            False,
        ),
        (
            ("dummy.png", "INDEX", "/bin"),
            (0, "-\t-\tdummy.png", ""),
            [
                "git",
                "diff",
                "--numstat",
                "--cached",
                "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
                "--",
                "dummy.png",
            ],
            True,
        ),
        (
            ("dummy.txt", "ar539ie5", "/bin"),
            (128, "", "fatal: Git command failed"),
            [
                "git",
                "diff",
                "--numstat",
                "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
                "ar539ie5",
                "--",
                "dummy.txt",
            ],
            tornado.web.HTTPError,
        ),
        (
            ("dummy.txt", "ar539ie5", "/bin"),
            (
                128,
                "",
                "fatal: Path 'dummy.txt' does not exist (neither on disk nor in the index)",
            ),
            [
                "git",
                "diff",
                "--numstat",
                "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
                "ar539ie5",
                "--",
                "dummy.txt",
            ],
            False,
        ),
    ],
)
async def test_is_binary_file(args, cli_result, cmd, expected):
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = maybe_future(cli_result)

        if isinstance(expected, type) and issubclass(expected, Exception):
            with pytest.raises(expected):
                await Git()._is_binary(*args)
        else:
            # When
            actual_response = await Git()._is_binary(*args)

            # Then
            mock_execute.assert_called_once_with(
                cmd,
                cwd="/bin",
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            )

            assert actual_response == expected


@pytest.mark.asyncio
async def test_Git_get_nbdiff_file():
    HERE = Path(__file__).parent.resolve()

    manager = Git()
    prev_content = (HERE / "samples" / "ipynb_base.json").read_text()
    curr_content = (HERE / "samples" / "ipynb_remote.json").read_text()

    result = await manager.get_nbdiff(prev_content, curr_content)

    expected_result = json.loads((HERE / "samples" / "ipynb_nbdiff.json").read_text())
    assert result == expected_result


@pytest.mark.asyncio
async def test_Git_get_nbdiff_dict():
    HERE = Path(__file__).parent.resolve()

    manager = Git()
    prev_content = json.loads((HERE / "samples" / "ipynb_base.json").read_text())
    curr_content = json.loads((HERE / "samples" / "ipynb_remote.json").read_text())

    result = await manager.get_nbdiff(prev_content, curr_content)

    expected_result = json.loads((HERE / "samples" / "ipynb_nbdiff.json").read_text())
    assert result == expected_result


@pytest.mark.asyncio
async def test_Git_get_nbdiff_no_content():
    HERE = Path(__file__).parent.resolve()

    manager = Git()

    result = await manager.get_nbdiff("", "")

    assert result == {
        "base": nbformat.versions[nbformat.current_nbformat].new_notebook(),
        "diff": [],
    }
