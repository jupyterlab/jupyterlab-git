from unittest.mock import patch

import pytest

from jupyterlab_git_core.git import Git, GitParameterError


@pytest.mark.parametrize(
    "method, args",
    [
        ("branch_delete", ("path", "--evil")),
        ("reset_to_commit", ("--evil", "path")),
        ("checkout_new_branch", ("ok", "--evil", "path")),
        ("checkout_branch", ("--evil", "path")),
        ("merge", ("--evil", "path")),
        ("push", ("--evil", "HEAD", "path")),
        ("set_tag", ("path", "--evil", "HEAD")),
        ("rebase", ("--evil", "path")),
    ],
)
@patch("jupyterlab_git_core.git.execute")
async def test_option_like_ref_is_rejected(mock_execute, method, args):
    # A ref starting with "-" would be parsed by git as an option, so the
    # method must reject it before any git command runs.
    with pytest.raises(GitParameterError):
        await getattr(Git(), method)(*args)
    mock_execute.assert_not_called()
