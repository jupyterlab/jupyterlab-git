from unittest.mock import patch

import pytest

from jupyterlab_git_core.git import Git, GitParameterError


@pytest.mark.asyncio
async def test_git_rebase():
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = (0, "Successfully rebased", "")

        # When
        actual_response = await Git().rebase(branch="feature", path="test_path")

        # Then
        called_cmd = mock_execute.call_args.args[0]
        assert called_cmd == ["git", "rebase", "feature"]
        assert {"code": 0, "message": "Successfully rebased"} == actual_response


@pytest.mark.asyncio
async def test_git_rebase_option_like_branch_is_rejected():
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # A branch that would inject git's --exec option is rejected before
        # any git command runs.
        with pytest.raises(GitParameterError):
            await Git().rebase(branch="--exec=touch /tmp/pwned", path="test_path")
        mock_execute.assert_not_called()
