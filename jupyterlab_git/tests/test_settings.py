import json
from unittest.mock import patch

from packaging.version import parse

from jupyterlab_git import __version__
from jupyterlab_git.handlers import NAMESPACE

from .testutils import maybe_future


@patch("jupyterlab_git.git.execute")
async def test_git_get_settings_success(mock_execute, jp_fetch):
    # Given
    git_version = "2.10.3"
    jlab_version = "2.1.42-alpha.24"
    mock_execute.return_value = maybe_future(
        (0, "git version {}.os_platform.42".format(git_version), "")
    )

    # When
    response = await jp_fetch(
        NAMESPACE, "settings", method="GET", params={"version": jlab_version}
    )

    # Then
    mock_execute.assert_called_once_with(
        ["git", "--version"],
        cwd=".",
        timeout=20,
        env=None,
        username=None,
        password=None,
        is_binary=False,
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {
        "frontendVersion": str(parse(jlab_version)),
        "gitVersion": git_version,
        "serverVersion": str(parse(__version__)),
    }


@patch("jupyterlab_git.git.execute")
async def test_git_get_settings_no_git(mock_execute, jp_fetch):
    # Given
    jlab_version = "2.1.42-alpha.24"
    mock_execute.side_effect = FileNotFoundError(
        "[Errno 2] No such file or directory: 'git'"
    )

    # When
    response = await jp_fetch(
        NAMESPACE, "settings", method="GET", params={"version": jlab_version}
    )

    # Then
    mock_execute.assert_called_once_with(
        ["git", "--version"],
        cwd=".",
        timeout=20,
        env=None,
        username=None,
        password=None,
        is_binary=False,
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {
        "frontendVersion": str(parse(jlab_version)),
        "gitVersion": None,
        "serverVersion": str(parse(__version__)),
    }


@patch("jupyterlab_git.git.execute")
async def test_git_get_settings_no_jlab(mock_execute, jp_fetch):
    # Given
    git_version = "2.10.3"
    mock_execute.return_value = maybe_future(
        (0, "git version {}.os_platform.42".format(git_version), "")
    )

    # When
    response = await jp_fetch(NAMESPACE, "settings", method="GET")

    # Then
    mock_execute.assert_called_once_with(
        ["git", "--version"],
        cwd=".",
        timeout=20,
        env=None,
        username=None,
        password=None,
        is_binary=False,
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {
        "frontendVersion": None,
        "gitVersion": git_version,
        "serverVersion": str(parse(__version__)),
    }
