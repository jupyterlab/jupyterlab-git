from unittest.mock import patch

import pytest

from jupyterlab_git_core.git import Git


@pytest.mark.asyncio
async def test_git_rebase_uses_end_of_options():
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = (0, "Successfully rebased", "")

        # When
        actual_response = await Git().rebase(branch="feature", path="test_path")

        # Then: --end-of-options separates the ref from any options so a value
        # beginning with "-" cannot be parsed by git as an option.
        called_cmd = mock_execute.call_args.args[0]
        assert called_cmd == ["git", "rebase", "--end-of-options", "feature"]
        assert {"code": 0, "message": "Successfully rebased"} == actual_response


@pytest.mark.asyncio
async def test_git_rebase_option_like_branch_is_not_an_option():
    with patch("jupyterlab_git_core.git.execute") as mock_execute:
        # Given a malicious "branch" that would inject git's --exec option
        mock_execute.return_value = (0, "", "")

        # When
        await Git().rebase(branch="--exec=touch /tmp/pwned", path="test_path")

        # Then the payload sits after --end-of-options, where git treats it as
        # a ref name, never as an option.
        called_cmd = mock_execute.call_args.args[0]
        assert called_cmd[:3] == ["git", "rebase", "--end-of-options"]
        assert called_cmd[3] == "--exec=touch /tmp/pwned"
