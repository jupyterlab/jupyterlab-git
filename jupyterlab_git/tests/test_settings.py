import os
from unittest.mock import Mock, patch

from packaging.version import parse

from jupyterlab_git import __version__
from jupyterlab_git.handlers import GitSettingsHandler

from .testutils import ServerTest, assert_http_error, maybe_future


class TestSettings(ServerTest):
    @patch("jupyterlab_git.git.execute")
    def test_git_get_settings_success(self, mock_execute):
        # Given
        git_version = "2.10.3"
        jlab_version = "2.1.42-alpha.24"
        mock_execute.return_value = maybe_future(
            (0, "git version {}.os_platform.42".format(git_version), "")
        )

        # When
        response = self.tester.get(["settings"], params={"version": jlab_version})

        # Then
        mock_execute.assert_called_once_with(["git", "--version"], cwd=os.curdir)

        assert response.status_code == 200
        payload = response.json()
        assert payload == {
            "frontendVersion": str(parse(jlab_version)),
            "gitVersion": git_version,
            "serverRoot": self.notebook.notebook_dir,
            "serverVersion": str(parse(__version__)),
        }

    @patch("jupyterlab_git.git.execute")
    def test_git_get_settings_no_git(self, mock_execute):
        # Given
        jlab_version = "2.1.42-alpha.24"
        mock_execute.side_effect = FileNotFoundError(
            "[Errno 2] No such file or directory: 'git'"
        )

        # When
        response = self.tester.get(["settings"], params={"version": jlab_version})

        # Then
        mock_execute.assert_called_once_with(["git", "--version"], cwd=os.curdir)

        assert response.status_code == 200
        payload = response.json()
        assert payload == {
            "frontendVersion": str(parse(jlab_version)),
            "gitVersion": None,
            "serverRoot": self.notebook.notebook_dir,
            "serverVersion": str(parse(__version__)),
        }

    @patch("jupyterlab_git.git.execute")
    def test_git_get_settings_no_jlab(self, mock_execute):
        # Given
        git_version = "2.10.3"
        mock_execute.return_value = maybe_future(
            (0, "git version {}.os_platform.42".format(git_version), "")
        )

        # When
        response = self.tester.get(["settings"])

        # Then
        mock_execute.assert_called_once_with(["git", "--version"], cwd=os.curdir)

        assert response.status_code == 200
        payload = response.json()
        assert payload == {
            "frontendVersion": None,
            "gitVersion": git_version,
            "serverRoot": self.notebook.notebook_dir,
            "serverVersion": str(parse(__version__)),
        }
