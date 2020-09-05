import os
from unittest.mock import Mock, call, patch

import pytest
import tornado

from jupyterlab_git.git import Git

from .testutils import FakeContentManager, ServerTest, maybe_future


@pytest.mark.asyncio
async def test_git_tag_success():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        tag = "1.0.0"
        # Given
        mock_execute.return_value = maybe_future((0, tag, ""))

        # When
        actual_response = await Git(FakeContentManager("/bin")).tags("test_curr_path")

        # Then
        mock_execute.assert_called_once_with(
            ["git", "tag", "--list"],
            cwd=os.path.join("/bin", "test_curr_path"),
        )

        assert {"code": 0, "tags": [tag]} == actual_response


@pytest.mark.asyncio
async def test_git_tag_checkout_success():
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute:
            tag = "mock_tag"
            # Given
            mock_execute.return_value = maybe_future((0, "", ""))

            # When
            actual_response = await Git(FakeContentManager("/bin")).tag_checkout(
                "test_curr_path", "mock_tag"
            )

            # Then
            mock_execute.assert_called_once_with(
                ["git", "checkout", "tags/{}".format(tag)],
                cwd=os.path.join("/bin", "test_curr_path"),
            )

            assert {
                "code": 0,
                "message": "Tag {} checked out".format(tag),
            } == actual_response
