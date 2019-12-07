import os
from unittest.mock import Mock, call, patch

import tornado

from jupyterlab_git.git import Git

from .testutils import FakeContentManager


@patch("jupyterlab_git.git.execute")
@patch("os.environ", {"TEST": "test"})
def test_git_clone_success(mock_execute):
    # Given
    mock_execute.return_value = tornado.gen.maybe_future((0, "output", "error"))

    # When
    actual_response = (
        Git(FakeContentManager("/bin"))
        .clone(current_path="test_curr_path", repo_url="ghjkhjkl")
        .result()
    )

    # Then
    mock_execute.assert_called_once_with(
        ["git", "clone", "ghjkhjkl"],
        cwd=os.path.join("/bin", "test_curr_path"),
        env={"TEST": "test", "GIT_TERMINAL_PROMPT": "0"},
    )
    assert {"code": 0} == actual_response


@patch("jupyterlab_git.git.execute")
@patch("os.environ", {"TEST": "test"})
def test_git_clone_failure_from_git(mock_execute):
    """
    Git internally will throw an error if it is an invalid URL, or if there is a permissions issue. We want to just
    relay it back to the user.

    """
    # Given
    mock_execute.return_value = tornado.gen.maybe_future(
        (128, "test_output", "fatal: Not a git repository")
    )

    # When
    actual_response = (
        Git(FakeContentManager("/bin"))
        .clone(current_path="test_curr_path", repo_url="ghjkhjkl")
        .result()
    )

    # Then
    mock_execute.assert_called_once_with(
        ["git", "clone", "ghjkhjkl"],
        cwd=os.path.join("/bin", "test_curr_path"),
        env={"TEST": "test", "GIT_TERMINAL_PROMPT": "0"},
    )
    assert {"code": 128, "message": "fatal: Not a git repository"} == actual_response


@patch("jupyterlab_git.git.execute_with_authentication")
@patch("os.environ", {"TEST": "test"})
def test_git_clone_with_auth_success(mock_authentication):
    # Given
    mock_authentication.return_value = tornado.gen.maybe_future((0, ""))

    # When
    auth = {"username": "asdf", "password": "qwerty"}
    actual_response = (
        Git(FakeContentManager("/bin"))
        .clone(current_path="test_curr_path", repo_url="ghjkhjkl", auth=auth)
        .result()
    )

    # Then
    mock_authentication.assert_called_once_with(
        ["git", "clone", "ghjkhjkl", "-q"],
        username="asdf",
        password="qwerty",
        cwd=os.path.join("/bin", "test_curr_path"),
        env={"TEST": "test", "GIT_TERMINAL_PROMPT": "1"},
    )
    assert {"code": 0} == actual_response


@patch("jupyterlab_git.git.execute_with_authentication")
@patch("os.environ", {"TEST": "test"})
def test_git_clone_with_auth_wrong_repo_url_failure_from_git(mock_authentication):
    """
    Git internally will throw an error if it is an invalid URL, or if there is a permissions issue. We want to just
    relay it back to the user.

    """
    # Given
    mock_authentication.return_value = tornado.gen.maybe_future(
        (128, "fatal: repository 'ghjkhjkl' does not exist")
    )

    # When
    auth = {"username": "asdf", "password": "qwerty"}
    actual_response = (
        Git(FakeContentManager("/bin"))
        .clone(current_path="test_curr_path", repo_url="ghjkhjkl", auth=auth)
        .result()
    )

    # Then
    mock_authentication.assert_called_once_with(
        ["git", "clone", "ghjkhjkl", "-q"],
        username="asdf",
        password="qwerty",
        cwd=os.path.join("/bin", "test_curr_path"),
        env={"TEST": "test", "GIT_TERMINAL_PROMPT": "1"},
    )
    assert {
        "code": 128,
        "message": "fatal: repository 'ghjkhjkl' does not exist",
    } == actual_response


@patch("jupyterlab_git.git.execute_with_authentication")
@patch("os.environ", {"TEST": "test"})
def test_git_clone_with_auth_auth_failure_from_git(mock_authentication):
    """
    Git internally will throw an error if it is an invalid URL, or if there is a permissions issue. We want to just
    relay it back to the user.

    """
    # Given
    mock_authentication.return_value = tornado.gen.maybe_future(
        (
            128,
            "remote: Invalid username or password.\r\nfatal: Authentication failed for 'ghjkhjkl'",
        )
    )

    # When
    auth = {"username": "asdf", "password": "qwerty"}
    actual_response = (
        Git(FakeContentManager("/bin"))
        .clone(current_path="test_curr_path", repo_url="ghjkhjkl", auth=auth)
        .result()
    )

    # Then
    mock_authentication.assert_called_once_with(
        ["git", "clone", "ghjkhjkl", "-q"],
        username="asdf",
        password="qwerty",
        cwd=os.path.join("/bin", "test_curr_path"),
        env={"TEST": "test", "GIT_TERMINAL_PROMPT": "1"},
    )
    assert {
        "code": 128,
        "message": "remote: Invalid username or password.\r\nfatal: Authentication failed for 'ghjkhjkl'",
    } == actual_response
