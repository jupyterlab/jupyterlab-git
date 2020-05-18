import os
from unittest.mock import Mock, call, patch

import pytest
import tornado

from jupyterlab_git.git import Git
from jupyterlab_git.handlers import GitTagHandler

from .testutils import FakeContentManager, ServerTest

@pytest.mark.asyncio
async def test_git_tag_success():
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute:
            # Given
            mock_execute.return_value = tornado.gen.maybe_future((0, "output", ""))

            # When
            actual_response = await Git(FakeContentManager("/bin")).tags("test_curr_path")

            # Then
            mock_execute.assert_called_once_with(
                ["git", "tag"],
                cwd=os.path.join("/bin", "test_curr_path"),
            )

            assert "'code': 0" in str(actual_response)


@pytest.mark.asyncio
async def test_git_tag_checkout_success():
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute:
            # Given
            mock_execute.return_value = tornado.gen.maybe_future((0, "output", ""))

            # When
            actual_response = await Git(FakeContentManager("/bin")).tag_checkout("test_curr_path", "mock_tag")

            # Then
            mock_execute.assert_called_once_with(
                ["git", "checkout", "tags/mock_tag", "-b", "mock_tag_branch"],
                cwd=os.path.join("/bin", "test_curr_path"),
            )

            assert "'code': 0" in str(actual_response)

@pytest.mark.asyncio
async def test_git_tag_error_messages():
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.Git.error_messages") as mock_execute:
            # Given
            mock_execute.return_value = tornado.gen.maybe_future((128, "output", ""))

            # When
            parameters = {"current_path": ""}
            actual_response = await Git(FakeContentManager("/bin")).error_messages(parameters)

            # Then
            mock_execute.assert_called_once_with(parameters)

            assert "'code': 128" in str(actual_response)


