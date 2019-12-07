import os
import tornado
from subprocess import CalledProcessError

from unittest.mock import Mock, call, patch
import pytest
from tornado.web import HTTPError


from jupyterlab_git.git import Git

from .testutils import FakeContentManager


def test_changed_files_invalid_input():
    with pytest.raises(HTTPError):
        Git(FakeContentManager("/bin")).changed_files(
            base="64950a634cd11d1a01ddfedaeffed67b531cb11e"
        ).result()


@patch("jupyterlab_git.git.execute")
def test_changed_files_single_commit(mock_execute):
    # Given
    mock_execute.return_value = tornado.gen.maybe_future(
        (0, "file1.ipynb\nfile2.py", "")
    )

    # When
    actual_response = (
        Git(FakeContentManager("/bin"))
        .changed_files(single_commit="64950a634cd11d1a01ddfedaeffed67b531cb11e")
        .result()
    )

    # Then
    mock_execute.assert_called_once_with(
        ["git", "diff", "64950a634cd11d1a01ddfedaeffed67b531cb11e^!", "--name-only"],
        cwd="/bin",
    )
    assert {"code": 0, "files": ["file1.ipynb", "file2.py"]} == actual_response


@patch("jupyterlab_git.git.execute")
def test_changed_files_working_tree(mock_execute):
    # Given
    mock_execute.return_value = tornado.gen.maybe_future(
        (0, "file1.ipynb\nfile2.py", "")
    )

    # When
    actual_response = (
        Git(FakeContentManager("/bin"))
        .changed_files(base="WORKING", remote="HEAD")
        .result()
    )

    # Then
    mock_execute.assert_called_once_with(
        ["git", "diff", "HEAD", "--name-only"], cwd="/bin"
    )
    assert {"code": 0, "files": ["file1.ipynb", "file2.py"]} == actual_response


@patch("jupyterlab_git.git.execute")
def test_changed_files_index(mock_execute):
    # Given
    mock_execute.return_value = tornado.gen.maybe_future(
        (0, "file1.ipynb\nfile2.py", "")
    )

    # When
    actual_response = (
        Git(FakeContentManager("/bin"))
        .changed_files(base="INDEX", remote="HEAD")
        .result()
    )

    # Then
    mock_execute.assert_called_once_with(
        ["git", "diff", "--staged", "HEAD", "--name-only"], cwd="/bin"
    )
    assert {"code": 0, "files": ["file1.ipynb", "file2.py"]} == actual_response


@patch("jupyterlab_git.git.execute")
def test_changed_files_two_commits(mock_execute):
    # Given
    mock_execute.return_value = tornado.gen.maybe_future(
        (0, "file1.ipynb\nfile2.py", "")
    )

    # When
    actual_response = (
        Git(FakeContentManager("/bin"))
        .changed_files(base="HEAD", remote="origin/HEAD")
        .result()
    )

    # Then
    mock_execute.assert_called_once_with(
        ["git", "diff", "HEAD", "origin/HEAD", "--name-only"], cwd="/bin"
    )
    assert {"code": 0, "files": ["file1.ipynb", "file2.py"]} == actual_response


@patch("jupyterlab_git.git.execute")
def test_changed_files_git_diff_error(mock_execute):
    # Given
    mock_execute.side_effect = CalledProcessError(128, b"cmd", b"error message")

    # When
    actual_response = Git(FakeContentManager("/bin")).changed_files(
        base="HEAD", remote="origin/HEAD"
    ).result()

    # Then
    mock_execute.assert_called_once_with(
        ["git", "diff", "HEAD", "origin/HEAD", "--name-only"], cwd="/bin"
    )
    assert {"code": 128, "message": "error message"} == actual_response
