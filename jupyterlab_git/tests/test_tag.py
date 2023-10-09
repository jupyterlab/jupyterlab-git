from unittest.mock import patch

import pytest

from jupyterlab_git.git import Git

from .testutils import maybe_future


@pytest.mark.asyncio
async def test_git_tag_success():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        output_tags = "v1.0.0\t6db57bf4987d387d439acd16ddfe8d54d46e8f4\nv2.0.1\t2aeae86b6010dd1f05b820d8753cff8349c181a6"

        # Given
        mock_execute.return_value = maybe_future((0, output_tags, ""))

        # When
        actual_response = await Git().tags("test_curr_path")

        # Then
        mock_execute.assert_called_once_with(
            [
                "git",
                "for-each-ref",
                "--format=%(refname:short)%09%(objectname)",
                "refs/tags",
            ],
            cwd="test_curr_path",
            timeout=20,
            env=None,
            username=None,
            password=None,
            is_binary=False,
        )

        expected_response = {
            "code": 0,
            "tags": [
                {
                    "name": "v1.0.0",
                    "baseCommitId": "6db57bf4987d387d439acd16ddfe8d54d46e8f4",
                },
                {
                    "name": "v2.0.1",
                    "baseCommitId": "2aeae86b6010dd1f05b820d8753cff8349c181a6",
                },
            ],
        }

        assert expected_response == actual_response


@pytest.mark.asyncio
async def test_git_tag_checkout_success():
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute:
            tag = "mock_tag"
            # Given
            mock_execute.return_value = maybe_future((0, "", ""))

            # When
            actual_response = await Git().tag_checkout("test_curr_path", "mock_tag")

            # Then
            mock_execute.assert_called_once_with(
                ["git", "checkout", "tags/{}".format(tag)],
                cwd="test_curr_path",
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            )

            assert {
                "code": 0,
                "message": "Tag {} checked out".format(tag),
            } == actual_response


@pytest.mark.asyncio
async def test_set_tag_succes():
    with patch("os.environ", {"TEST": "test"}):
        with patch("jupyterlab_git.git.execute") as mock_execute:
            tag = "mock_tag"
            commitId = "mock_commit_id"
            # Given
            mock_execute.return_value = maybe_future((0, "", ""))

            # When
            actual_response = await Git().set_tag(
                "test_curr_path", "mock_tag", "mock_commit_id"
            )

            # Then
            mock_execute.assert_called_once_with(
                ["git", "tag", tag, commitId],
                cwd="test_curr_path",
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            )

            assert {
                "code": 0,
                "message": "Tag {} created, pointing to commit {}".format(
                    tag, commitId
                ),
            } == actual_response
