from subprocess import PIPE, STDOUT, CalledProcessError

from mock import Mock, call, patch
import pytest
from tornado.web import HTTPError


from jupyterlab_git.git import Git


def test_changed_files_invalid_input():
    with pytest.raises(HTTPError):
        actual_response = Git(root_dir="/bin").changed_files(
            base="64950a634cd11d1a01ddfedaeffed67b531cb11e"
        )


@patch("subprocess.check_output")
def test_changed_files_single_commit(mock_call):
    # Given
    mock_call.return_value = b"file1.ipynb\nfile2.py"

    # When
    actual_response = Git(root_dir="/bin").changed_files(
        single_commit="64950a634cd11d1a01ddfedaeffed67b531cb11e"
    )

    # Then
    mock_call.assert_called_with(
        ["git", "diff", "64950a634cd11d1a01ddfedaeffed67b531cb11e^!", "--name-only"],
        cwd="/bin",
        stderr=STDOUT,
    )
    assert {"code": 0, "files": ["file1.ipynb", "file2.py"]} == actual_response


@patch("subprocess.check_output")
def test_changed_files_working_tree(mock_call):
    # Given
    mock_call.return_value = b"file1.ipynb\nfile2.py"

    # When
    actual_response = Git(root_dir="/bin").changed_files(base="WORKING", remote="HEAD")

    # Then
    mock_call.assert_called_with(
        ["git", "diff", "HEAD", "--name-only"], cwd="/bin", stderr=STDOUT
    )
    assert {"code": 0, "files": ["file1.ipynb", "file2.py"]} == actual_response


@patch("subprocess.check_output")
def test_changed_files_index(mock_call):
    # Given
    mock_call.return_value = b"file1.ipynb\nfile2.py"

    # When
    actual_response = Git(root_dir="/bin").changed_files(base="INDEX", remote="HEAD")

    # Then
    mock_call.assert_called_with(
        ["git", "diff", "--staged", "HEAD", "--name-only"], cwd="/bin", stderr=STDOUT
    )
    assert {"code": 0, "files": ["file1.ipynb", "file2.py"]} == actual_response


@patch("subprocess.check_output")
def test_changed_files_two_commits(mock_call):
    # Given
    mock_call.return_value = b"file1.ipynb\nfile2.py"

    # When
    actual_response = Git(root_dir="/bin").changed_files(
        base="HEAD", remote="origin/HEAD"
    )

    # Then
    mock_call.assert_called_with(
        ["git", "diff", "HEAD", "origin/HEAD", "--name-only"], cwd="/bin", stderr=STDOUT
    )
    assert {"code": 0, "files": ["file1.ipynb", "file2.py"]} == actual_response


@patch("subprocess.check_output")
def test_changed_files_git_diff_error(mock_call):
    # Given
    mock_call.side_effect = CalledProcessError(128, "cmd", b"error message")

    # When
    actual_response = Git(root_dir="/bin").changed_files(
        base="HEAD", remote="origin/HEAD"
    )

    # Then
    mock_call.assert_called_with(
        ["git", "diff", "HEAD", "origin/HEAD", "--name-only"], cwd="/bin", stderr=STDOUT
    )
    assert {"code": 128, "message": "error message"} == actual_response
