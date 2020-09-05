# python lib
import os
from unittest.mock import Mock, call, patch

import pytest
import tornado

# local lib
from jupyterlab_git.git import Git

from .testutils import FakeContentManager, maybe_future


def test_is_remote_branch():
    test_cases = [
        ("refs/heads/feature-foo", False),
        ("refs/heads/master", False),
        ("refs/remotes/origin/feature-foo", True),
        ("refs/remotes/origin/HEAD", True),
        ("refs/stash", False),
        ("refs/tags/v0.1.0", False),
        ("refs/tags/blah@0.2.0", False),
    ]
    for test_case in test_cases:
        actual_response = Git(FakeContentManager("/bin"))._is_remote_branch(
            test_case[0]
        )
        assert test_case[1] == actual_response


@pytest.mark.asyncio
async def test_get_current_branch_success():

    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = maybe_future((0, "feature-foo", ""))

        # When
        actual_response = await (
            Git(FakeContentManager("/bin")).get_current_branch(
                current_path="test_curr_path"
            )
        )

        # Then
        mock_execute.assert_called_once_with(
            ["git", "symbolic-ref", "--short", "HEAD"],
            cwd=os.path.join("/bin", "test_curr_path"),
        )
        assert "feature-foo" == actual_response


@pytest.mark.asyncio
async def test_checkout_branch_noref_success():
    branch = "test-branch"
    curr_path = "test_curr_path"
    stdout_message = "checkout output from git"
    stderr_message = ""
    rc = 0

    with patch("jupyterlab_git.git.execute") as mock_execute:
        with patch.object(
            Git, "_get_branch_reference", return_value=maybe_future(None)
        ) as mock__get_branch_reference:
            # Given
            mock_execute.return_value = maybe_future(
                (rc, stdout_message, stderr_message)
            )

            # When
            actual_response = await Git(FakeContentManager("/bin")).checkout_branch(
                branchname=branch, current_path=curr_path
            )

            # Then
            mock__get_branch_reference.assert_has_calls([call(branch, curr_path)])

            cmd = ["git", "checkout", branch]
            mock_execute.assert_called_once_with(
                cmd, cwd=os.path.join("/bin", "test_curr_path")
            )

            assert {"code": rc, "message": stdout_message} == actual_response


@pytest.mark.asyncio
async def test_checkout_branch_noref_failure():
    branch = "test-branch"
    curr_path = "test_curr_path"
    stdout_message = ""
    stderr_message = (
        "error: pathspec '{}' did not match any file(s) known to git".format(branch)
    )
    rc = 1
    with patch("jupyterlab_git.git.execute") as mock_execute:
        with patch.object(
            Git, "_get_branch_reference", return_value=maybe_future(None)
        ) as mock__get_branch_reference:
            # Given
            mock_execute.return_value = maybe_future(
                (rc, stdout_message, stderr_message)
            )

            # When
            actual_response = await Git(FakeContentManager("/bin")).checkout_branch(
                branchname=branch, current_path=curr_path
            )

            # Then
            mock__get_branch_reference.assert_has_calls([call(branch, curr_path)])

            cmd = ["git", "checkout", branch]
            mock_execute.assert_called_once_with(
                cmd, cwd=os.path.join("/bin", "test_curr_path")
            )

            assert {
                "code": rc,
                "message": stderr_message,
                "command": " ".join(cmd),
            } == actual_response


@pytest.mark.asyncio
async def test_checkout_branch_remoteref_success():
    branch = "test-branch"
    curr_path = "test_curr_path"
    stdout_message = "checkout output from git"
    stderr_message = ""
    rc = 0

    with patch("jupyterlab_git.git.execute") as mock_execute:
        with patch.object(
            Git,
            "_get_branch_reference",
            return_value=maybe_future("refs/remotes/remote_branch"),
        ) as mock__get_branch_reference:
            # Given
            mock_execute.return_value = maybe_future(
                (rc, stdout_message, stderr_message)
            )

            # When
            actual_response = await Git(FakeContentManager("/bin")).checkout_branch(
                branchname=branch, current_path=curr_path
            )

            # Then
            mock__get_branch_reference.assert_has_calls([call(branch, curr_path)])

            cmd = ["git", "checkout", "--track", branch]
            mock_execute.assert_called_once_with(
                cmd, cwd=os.path.join("/bin", "test_curr_path")
            )

            assert {"code": rc, "message": stdout_message} == actual_response


@pytest.mark.asyncio
async def test_checkout_branch_headsref_failure():
    branch = "test-branch"
    curr_path = "test_curr_path"
    stdout_message = ""
    stderr_message = (
        "error: pathspec '{}' did not match any file(s) known to git".format(branch)
    )
    rc = 1

    with patch("jupyterlab_git.git.execute") as mock_execute:
        with patch.object(
            Git,
            "_get_branch_reference",
            return_value=maybe_future("refs/heads/local_branch"),
        ) as mock__get_branch_reference:
            # Given
            mock_execute.return_value = maybe_future(
                (rc, stdout_message, stderr_message)
            )

            # When
            actual_response = await Git(FakeContentManager("/bin")).checkout_branch(
                branchname=branch, current_path=curr_path
            )

            # Then
            mock__get_branch_reference.assert_has_calls([call(branch, curr_path)])

            cmd = ["git", "checkout", branch]
            mock_execute.assert_called_once_with(
                cmd, cwd=os.path.join("/bin", "test_curr_path")
            )
            assert {
                "code": rc,
                "message": stderr_message,
                "command": " ".join(cmd),
            } == actual_response


@pytest.mark.asyncio
async def test_checkout_branch_headsref_success():
    branch = "test-branch"
    stdout_message = "checkout output from git"
    stderr_message = ""
    rc = 0

    with patch("jupyterlab_git.git.execute") as mock_execute:
        with patch.object(
            Git,
            "_get_branch_reference",
            return_value=maybe_future("refs/heads/local_branch"),
        ):
            # Given
            mock_execute.return_value = maybe_future(
                (rc, stdout_message, stderr_message)
            )

            # When
            actual_response = await Git(FakeContentManager("/bin")).checkout_branch(
                branchname=branch, current_path="test_curr_path"
            )

            # Then
            cmd = ["git", "checkout", branch]
            mock_execute.assert_called_once_with(
                cmd, cwd=os.path.join("/bin", "test_curr_path")
            )
            assert {"code": rc, "message": stdout_message} == actual_response


@pytest.mark.asyncio
async def test_checkout_branch_remoteref_failure():
    branch = "test-branch"
    stdout_message = ""
    stderr_message = (
        "error: pathspec '{}' did not match any file(s) known to git".format(branch)
    )
    rc = 1

    with patch("jupyterlab_git.git.execute") as mock_execute:
        with patch.object(
            Git,
            "_get_branch_reference",
            return_value=maybe_future("refs/remotes/remote_branch"),
        ):
            # Given
            mock_execute.return_value = maybe_future(
                (rc, stdout_message, stderr_message)
            )

            # When
            actual_response = await Git(FakeContentManager("/bin")).checkout_branch(
                branchname=branch, current_path="test_curr_path"
            )

            # Then
            cmd = ["git", "checkout", "--track", branch]
            mock_execute.assert_called_once_with(
                cmd, cwd=os.path.join("/bin", "test_curr_path")
            )
            assert {
                "code": rc,
                "message": stderr_message,
                "command": " ".join(cmd),
            } == actual_response


@pytest.mark.asyncio
async def test_get_branch_reference_success():

    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        actual_response = 0
        branch = "test-branch"
        reference = "refs/remotes/origin/test_branch"

        mock_execute.return_value = maybe_future((0, reference, ""))

        # When
        actual_response = await Git(FakeContentManager("/bin"))._get_branch_reference(
            branchname=branch, current_path="test_curr_path"
        )

        # Then
        mock_execute.assert_called_once_with(
            ["git", "rev-parse", "--symbolic-full-name", branch],
            cwd=os.path.join("/bin", "test_curr_path"),
        )
        assert actual_response == reference


@pytest.mark.asyncio
async def test_get_branch_reference_failure():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        actual_response = 0
        branch = "test-branch"
        reference = "test-branch"
        # Given
        mock_execute.return_value = maybe_future(
            (
                128,
                reference,
                "fatal: ambiguous argument '{}': unknown revision or path not in the working tree.".format(
                    branch
                ),
            )
        )

        # When
        actual_response = await Git(FakeContentManager("/bin"))._get_branch_reference(
            branchname=branch, current_path="test_curr_path"
        )

        # Then
        mock_execute.assert_called_once_with(
            ["git", "rev-parse", "--symbolic-full-name", branch],
            cwd=os.path.join("/bin", "test_curr_path"),
        )
        assert actual_response is None


@pytest.mark.asyncio
async def test_get_current_branch_failure():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = maybe_future(
            (
                128,
                "",
                "fatal: Not a git repository (or any of the parent directories): .git",
            )
        )

        # When
        with pytest.raises(Exception) as error:
            await Git(FakeContentManager("/bin")).get_current_branch(
                current_path="test_curr_path"
            )

        # Then
        mock_execute.assert_called_once_with(
            ["git", "symbolic-ref", "--short", "HEAD"],
            cwd=os.path.join("/bin", "test_curr_path"),
        )
        assert (
            "Error [fatal: Not a git repository (or any of the parent directories): .git] "
            "occurred while executing [git symbolic-ref --short HEAD] command to get current branch."
            == str(error.value)
        )


@pytest.mark.asyncio
async def test_get_current_branch_detached_success():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        process_output = [
            "* (HEAD detached at origin/feature-foo)",
            "  master",
            "  remotes/origin/feature-foo",
            "  remotes/origin/HEAD",
        ]
        mock_execute.return_value = maybe_future((0, "\n".join(process_output), ""))

        # When
        actual_response = await Git(
            FakeContentManager("/bin")
        )._get_current_branch_detached(current_path="test_curr_path")

        # Then
        mock_execute.assert_called_once_with(
            ["git", "branch", "-a"], cwd=os.path.join("/bin", "test_curr_path")
        )
        assert "(HEAD detached at origin/feature-foo)" == actual_response


@pytest.mark.asyncio
async def test_get_current_branch_detached_failure():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = maybe_future(
            (
                128,
                "",
                "fatal: Not a git repository (or any of the parent directories): .git",
            )
        )

        # When
        with pytest.raises(Exception) as error:
            await Git(FakeContentManager("/bin"))._get_current_branch_detached(
                current_path="test_curr_path"
            )

        # Then
        mock_execute.assert_called_once_with(
            ["git", "branch", "-a"], cwd=os.path.join("/bin", "test_curr_path")
        )
        assert (
            "Error [fatal: Not a git repository (or any of the parent directories): .git] "
            "occurred while executing [git branch -a] command to get detached HEAD name."
            == str(error.value)
        )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "branch,upstream,remotename",
    [
        ("feature-foo", "master", "origin/withslash"),
        ("master", "master", "origin"),
        ("feature/bar", "feature-foo", ""),
    ],
)
async def test_get_upstream_branch_success(branch, upstream, remotename):
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.side_effect = [
            maybe_future((0, remotename + "/" + upstream, "")),
            maybe_future((0, remotename, "")),
        ]

        # When
        actual_response = await Git(FakeContentManager("/bin")).get_upstream_branch(
            current_path="test_curr_path", branch_name=branch
        )

        # Then
        mock_execute.assert_has_calls(
            [
                call(
                    [
                        "git",
                        "rev-parse",
                        "--abbrev-ref",
                        "{}@{{upstream}}".format(branch),
                    ],
                    cwd=os.path.join("/bin", "test_curr_path"),
                ),
                call(
                    ["git", "config", "--local", "branch.{}.remote".format(branch)],
                    cwd="/bin/test_curr_path",
                ),
            ],
            any_order=False,
        )
        assert {
            "code": 0,
            "remote_branch": upstream,
            "remote_short_name": remotename,
        } == actual_response


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "outputs, message",
    [
        (
            (128, "", "fatal: no such branch: 'blah'"),
            "Error [fatal: no such branch: 'blah'] "
            "occurred while executing [git rev-parse --abbrev-ref blah@{upstream}] command to get upstream branch.",
        ),
        ((128, "", "fatal: no upstream configured for branch"), ""),
        (
            (
                128,
                "",
                "fatal: ambiguous argument 'blah@origin': unknown revision or path not in the working tree.",
            ),
            "",
        ),
    ],
)
async def test_get_upstream_branch_failure(outputs, message):
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = maybe_future(outputs)

        # When
        response = await Git(FakeContentManager("/bin")).get_upstream_branch(
            current_path="test_curr_path", branch_name="blah"
        )
        expected = {
            "code": 128,
            "command": "git rev-parse --abbrev-ref blah@{upstream}",
            "message": outputs[2],
        }

        assert response == expected

        # Then
        mock_execute.assert_has_calls(
            [
                call(
                    ["git", "rev-parse", "--abbrev-ref", "blah@{upstream}"],
                    cwd=os.path.join("/bin", "test_curr_path"),
                )
            ],
            any_order=False,
        )


@pytest.mark.asyncio
async def test_get_tag_success():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = maybe_future((0, "v0.3.0", ""))

        # When
        actual_response = await Git(FakeContentManager("/bin"))._get_tag(
            current_path="test_curr_path",
            commit_sha="abcdefghijklmnopqrstuvwxyz01234567890123",
        )

        # Then
        mock_execute.assert_called_once_with(
            ["git", "describe", "--tags", "abcdefghijklmnopqrstuvwxyz01234567890123"],
            cwd=os.path.join("/bin", "test_curr_path"),
        )
        assert "v0.3.0" == actual_response


@pytest.mark.asyncio
async def test_get_tag_failure():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.side_effect = [
            maybe_future((128, "", "fatal: Not a valid object name blah")),
            maybe_future(
                (
                    128,
                    "",
                    "fatal: No tags can describe '01234567899999abcdefghijklmnopqrstuvwxyz'.",
                )
            ),
        ]

        # When
        with pytest.raises(Exception) as error:
            await Git(FakeContentManager("/bin"))._get_tag(
                current_path="test_curr_path", commit_sha="blah"
            )

        assert (
            "Error [fatal: Not a valid object name blah] "
            "occurred while executing [git describe --tags blah] command to get nearest tag associated with branch."
            == str(error.value)
        )

        actual_response = await Git(FakeContentManager("/bin"))._get_tag(
            current_path="test_curr_path",
            commit_sha="01234567899999abcdefghijklmnopqrstuvwxyz",
        )

        assert actual_response is None

        # Then
        mock_execute.assert_has_calls(
            [
                call(
                    ["git", "describe", "--tags", "blah"],
                    cwd=os.path.join("/bin", "test_curr_path"),
                ),
                call(
                    [
                        "git",
                        "describe",
                        "--tags",
                        "01234567899999abcdefghijklmnopqrstuvwxyz",
                    ],
                    cwd=os.path.join("/bin", "test_curr_path"),
                ),
            ],
            any_order=False,
        )


@pytest.mark.asyncio
async def test_no_tags():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        mock_execute.return_value = maybe_future(
            (128, "", "fatal: No names found, cannot describe anything.\n")
        )

        # When
        actual_response = await Git(FakeContentManager("/bin"))._get_tag(
            "/path/foo", "768c79ad661598889f29bdf8916f4cc488f5062a"
        )

        # Then
        mock_execute.assert_called_once_with(
            ["git", "describe", "--tags", "768c79ad661598889f29bdf8916f4cc488f5062a"],
            cwd="/path/foo",
        )
        assert actual_response is None


@pytest.mark.asyncio
async def test_branch_success():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        process_output_heads = [
            "feature-foo\tabcdefghijklmnopqrstuvwxyz01234567890123\torigin/feature-foo\t*",
            "master\tabcdefghijklmnopqrstuvwxyz01234567890123\torigin/master\t ",
            "feature-bar\t01234567899999abcdefghijklmnopqrstuvwxyz\t\t ",
        ]
        process_output_remotes = [
            "origin/feature-foo\tabcdefghijklmnopqrstuvwxyz01234567890123",
            "origin/master\tabcdefghijklmnopqrstuvwxyz01234567890123",
        ]

        mock_execute.side_effect = [
            # Response for get all refs/heads
            maybe_future((0, "\n".join(process_output_heads), "")),
            # Response for get all refs/remotes
            maybe_future((0, "\n".join(process_output_remotes), "")),
        ]

        expected_response = {
            "code": 0,
            "branches": [
                {
                    "is_current_branch": True,
                    "is_remote_branch": False,
                    "name": "feature-foo",
                    "upstream": "origin/feature-foo",
                    "top_commit": "abcdefghijklmnopqrstuvwxyz01234567890123",
                    "tag": None,
                },
                {
                    "is_current_branch": False,
                    "is_remote_branch": False,
                    "name": "master",
                    "upstream": "origin/master",
                    "top_commit": "abcdefghijklmnopqrstuvwxyz01234567890123",
                    "tag": None,
                },
                {
                    "is_current_branch": False,
                    "is_remote_branch": False,
                    "name": "feature-bar",
                    "upstream": None,
                    "top_commit": "01234567899999abcdefghijklmnopqrstuvwxyz",
                    "tag": None,
                },
                {
                    "is_current_branch": False,
                    "is_remote_branch": True,
                    "name": "origin/feature-foo",
                    "upstream": None,
                    "top_commit": "abcdefghijklmnopqrstuvwxyz01234567890123",
                    "tag": None,
                },
                {
                    "is_current_branch": False,
                    "is_remote_branch": True,
                    "name": "origin/master",
                    "upstream": None,
                    "top_commit": "abcdefghijklmnopqrstuvwxyz01234567890123",
                    "tag": None,
                },
            ],
            "current_branch": {
                "is_current_branch": True,
                "is_remote_branch": False,
                "name": "feature-foo",
                "upstream": "origin/feature-foo",
                "top_commit": "abcdefghijklmnopqrstuvwxyz01234567890123",
                "tag": None,
            },
        }

        # When
        actual_response = await Git(FakeContentManager("/bin")).branch(
            current_path="test_curr_path"
        )

        # Then
        mock_execute.assert_has_calls(
            [
                # call to get refs/heads
                call(
                    [
                        "git",
                        "for-each-ref",
                        "--format=%(refname:short)%09%(objectname)%09%(upstream:short)%09%(HEAD)",
                        "refs/heads/",
                    ],
                    cwd=os.path.join("/bin", "test_curr_path"),
                ),
                # call to get refs/remotes
                call(
                    [
                        "git",
                        "for-each-ref",
                        "--format=%(refname:short)%09%(objectname)",
                        "refs/remotes/",
                    ],
                    cwd=os.path.join("/bin", "test_curr_path"),
                ),
            ],
            any_order=False,
        )

        assert expected_response == actual_response


@pytest.mark.asyncio
async def test_branch_failure():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        expected_cmd = [
            "git",
            "for-each-ref",
            "--format=%(refname:short)%09%(objectname)%09%(upstream:short)%09%(HEAD)",
            "refs/heads/",
        ]
        mock_execute.return_value = maybe_future(
            (
                128,
                "",
                "fatal: Not a git repository (or any of the parent directories): .git",
            )
        )
        expected_response = {
            "code": 128,
            "command": " ".join(expected_cmd),
            "message": "fatal: Not a git repository (or any of the parent directories): .git",
        }

        # When
        actual_response = await Git(FakeContentManager("/bin")).branch(
            current_path="test_curr_path"
        )

        # Then
        mock_execute.assert_called_once_with(
            expected_cmd, cwd=os.path.join("/bin", "test_curr_path")
        )

        assert expected_response == actual_response


@pytest.mark.asyncio
async def test_branch_success_detached_head():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        process_output_heads = [
            "master\tabcdefghijklmnopqrstuvwxyz01234567890123\torigin/master\t "
        ]
        process_output_remotes = [
            "origin/feature-foo\tabcdefghijklmnopqrstuvwxyz01234567890123"
        ]
        detached_head_output = [
            "* (HEAD detached at origin/feature-foo)",
            "  master",
            "  remotes/origin/feature-foo",
        ]

        mock_execute.side_effect = [
            # Response for get all refs/heads
            maybe_future((0, "\n".join(process_output_heads), "")),
            # Response for get current branch
            maybe_future((128, "", "fatal: ref HEAD is not a symbolic ref")),
            # Response for get current branch detached
            maybe_future((0, "\n".join(detached_head_output), "")),
            # Response for get all refs/remotes
            maybe_future((0, "\n".join(process_output_remotes), "")),
        ]

        expected_response = {
            "code": 0,
            "branches": [
                {
                    "is_current_branch": False,
                    "is_remote_branch": False,
                    "name": "master",
                    "upstream": "origin/master",
                    "top_commit": "abcdefghijklmnopqrstuvwxyz01234567890123",
                    "tag": None,
                },
                {
                    "is_current_branch": True,
                    "is_remote_branch": False,
                    "name": "(HEAD detached at origin/feature-foo)",
                    "upstream": None,
                    "top_commit": None,
                    "tag": None,
                },
                {
                    "is_current_branch": False,
                    "is_remote_branch": True,
                    "name": "origin/feature-foo",
                    "upstream": None,
                    "top_commit": "abcdefghijklmnopqrstuvwxyz01234567890123",
                    "tag": None,
                },
            ],
            "current_branch": {
                "is_current_branch": True,
                "is_remote_branch": False,
                "name": "(HEAD detached at origin/feature-foo)",
                "upstream": None,
                "top_commit": None,
                "tag": None,
            },
        }

        # When
        actual_response = await Git(FakeContentManager("/bin")).branch(
            current_path="test_curr_path"
        )

        # Then
        mock_execute.assert_has_calls(
            [
                # call to get refs/heads
                call(
                    [
                        "git",
                        "for-each-ref",
                        "--format=%(refname:short)%09%(objectname)%09%(upstream:short)%09%(HEAD)",
                        "refs/heads/",
                    ],
                    cwd=os.path.join("/bin", "test_curr_path"),
                ),
                # call to get current branch
                call(
                    ["git", "symbolic-ref", "--short", "HEAD"],
                    cwd=os.path.join("/bin", "test_curr_path"),
                ),
                # call to get current branch name given a detached head
                call(
                    ["git", "branch", "-a"], cwd=os.path.join("/bin", "test_curr_path")
                ),
                # call to get refs/remotes
                call(
                    [
                        "git",
                        "for-each-ref",
                        "--format=%(refname:short)%09%(objectname)",
                        "refs/remotes/",
                    ],
                    cwd=os.path.join("/bin", "test_curr_path"),
                ),
            ],
            any_order=False,
        )

        assert expected_response == actual_response
