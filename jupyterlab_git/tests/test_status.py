from unittest.mock import call, patch

import pytest

# local lib
from jupyterlab_git.git import Git

from .testutils import maybe_future


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "output,diff_output,expected",
    [
        (
            (
                "## main",
                "A  notebook with spaces.ipynb",
                "M  notebook with λ.ipynb",
                "M  binary file.gif",
                "R  renamed_to_θ.py",
                "originally_named_π.py",
                "?? untracked.ipynb",
            ),
            (
                "0\t0\tnotebook with spaces.ipynb",
                "-\t-\tbinary file.gif",
                "0\t0\trenamed_to_θ.py",
            ),
            {
                "code": 0,
                "branch": "main",
                "remote": None,
                "ahead": 0,
                "behind": 0,
                "state": "DEFAULT",
                "files": [
                    {
                        "x": "A",
                        "y": " ",
                        "to": "notebook with spaces.ipynb",
                        "from": "notebook with spaces.ipynb",
                        "is_binary": False,
                    },
                    {
                        "x": "M",
                        "y": " ",
                        "to": "notebook with λ.ipynb",
                        "from": "notebook with λ.ipynb",
                        "is_binary": None,
                    },
                    {
                        "x": "M",
                        "y": " ",
                        "to": "binary file.gif",
                        "from": "binary file.gif",
                        "is_binary": True,
                    },
                    {
                        "x": "R",
                        "y": " ",
                        "to": "renamed_to_θ.py",
                        "from": "originally_named_π.py",
                        "is_binary": False,
                    },
                    {
                        "x": "?",
                        "y": "?",
                        "to": "untracked.ipynb",
                        "from": "untracked.ipynb",
                        "is_binary": None,
                    },
                ],
            },
        ),
        # Empty answer
        (
            ("## main",),
            (""),
            {
                "code": 0,
                "branch": "main",
                "remote": None,
                "ahead": 0,
                "behind": 0,
                "state": "DEFAULT",
                "files": [],
            },
        ),
        # With upstream only
        (
            ("## main...origin/main",),
            (""),
            {
                "code": 0,
                "branch": "main",
                "remote": "origin/main",
                "ahead": 0,
                "behind": 0,
                "state": "DEFAULT",
                "files": [],
            },
        ),
        # Ahead only
        (
            ("## main...origin/main [ahead 15]",),
            (""),
            {
                "code": 0,
                "branch": "main",
                "remote": "origin/main",
                "ahead": 15,
                "behind": 0,
                "state": "DEFAULT",
                "files": [],
            },
        ),
        # Behind only
        (
            ("## main...origin/main [behind 5]",),
            (""),
            {
                "code": 0,
                "branch": "main",
                "remote": "origin/main",
                "ahead": 0,
                "behind": 5,
                "state": "DEFAULT",
                "files": [],
            },
        ),
        # Ahead and behind
        (
            ("## main...origin/main [ahead 3, behind 5]",),
            (""),
            {
                "code": 0,
                "branch": "main",
                "remote": "origin/main",
                "ahead": 3,
                "behind": 5,
                "state": "DEFAULT",
                "files": [],
            },
        ),
        # Initial commit
        (
            ("## No commits yet on main",),
            (""),
            {
                "code": 0,
                "branch": "(initial)",
                "remote": None,
                "ahead": 0,
                "behind": 0,
                "state": "DEFAULT",
                "files": [],
            },
        ),
        # Detached head
        (
            ("## HEAD (no branch)",),
            (""),
            {
                "code": 0,
                "branch": "(detached)",
                "remote": None,
                "ahead": 0,
                "behind": 0,
                "state": "DETACHED",
                "files": [],
            },
        ),
        # Cherry pick
        (
            (
                "## master",
                "UD another_file.txt",
                "A  branch_file.py",
                "UU example.ipynb",
                "UU file.txt",
            ),
            (
                "1\t0\t.gitignore",
                "0\t0\tanother_file.txt",
                "21\t0\tbranch_file.py",
                "0\t0\texample.ipynb",
                "0\t0\tfile.txt",
                "-\t-\tgit_workflow.jpg",
                "-\t-\tjupyter.png",
                "16\t0\tmaster_file.ts",
            ),
            {
                "code": 0,
                "branch": "master",
                "remote": None,
                "ahead": 0,
                "behind": 0,
                "files": [
                    {
                        "x": "U",
                        "y": "D",
                        "to": "another_file.txt",
                        "from": "another_file.txt",
                        "is_binary": False,
                    },
                    {
                        "x": "A",
                        "y": " ",
                        "to": "branch_file.py",
                        "from": "branch_file.py",
                        "is_binary": False,
                    },
                    {
                        "x": "U",
                        "y": "U",
                        "to": "example.ipynb",
                        "from": "example.ipynb",
                        "is_binary": False,
                    },
                    {
                        "x": "U",
                        "y": "U",
                        "to": "file.txt",
                        "from": "file.txt",
                        "is_binary": False,
                    },
                ],
                "state": "CHERRY_PICKING",
            },
        ),
        # Rebasing
        (
            (
                "## master",
                "UD another_file.txt",
                "A  branch_file.py",
                "UU example.ipynb",
                "UU file.txt",
            ),
            (
                "1\t0\t.gitignore",
                "0\t0\tanother_file.txt",
                "21\t0\tbranch_file.py",
                "0\t0\texample.ipynb",
                "0\t0\tfile.txt",
                "-\t-\tgit_workflow.jpg",
                "-\t-\tjupyter.png",
                "16\t0\tmaster_file.ts",
            ),
            {
                "code": 0,
                "branch": "master",
                "remote": None,
                "ahead": 0,
                "behind": 0,
                "files": [
                    {
                        "x": "U",
                        "y": "D",
                        "to": "another_file.txt",
                        "from": "another_file.txt",
                        "is_binary": False,
                    },
                    {
                        "x": "A",
                        "y": " ",
                        "to": "branch_file.py",
                        "from": "branch_file.py",
                        "is_binary": False,
                    },
                    {
                        "x": "U",
                        "y": "U",
                        "to": "example.ipynb",
                        "from": "example.ipynb",
                        "is_binary": False,
                    },
                    {
                        "x": "U",
                        "y": "U",
                        "to": "file.txt",
                        "from": "file.txt",
                        "is_binary": False,
                    },
                ],
                "state": "REBASING",
            },
        ),
        # Merging
        (
            (
                "## master",
                "UD another_file.txt",
                "A  branch_file.py",
                "UU example.ipynb",
                "UU file.txt",
            ),
            (
                "1\t0\t.gitignore",
                "0\t0\tanother_file.txt",
                "21\t0\tbranch_file.py",
                "0\t0\texample.ipynb",
                "0\t0\tfile.txt",
                "-\t-\tgit_workflow.jpg",
                "-\t-\tjupyter.png",
                "16\t0\tmaster_file.ts",
            ),
            {
                "code": 0,
                "branch": "master",
                "remote": None,
                "ahead": 0,
                "behind": 0,
                "files": [
                    {
                        "x": "U",
                        "y": "D",
                        "to": "another_file.txt",
                        "from": "another_file.txt",
                        "is_binary": False,
                    },
                    {
                        "x": "A",
                        "y": " ",
                        "to": "branch_file.py",
                        "from": "branch_file.py",
                        "is_binary": False,
                    },
                    {
                        "x": "U",
                        "y": "U",
                        "to": "example.ipynb",
                        "from": "example.ipynb",
                        "is_binary": False,
                    },
                    {
                        "x": "U",
                        "y": "U",
                        "to": "file.txt",
                        "from": "file.txt",
                        "is_binary": False,
                    },
                ],
                "state": "MERGING",
            },
        ),
    ],
)
async def test_status(output, diff_output, expected):
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        repository = "test_curr_path"
        mock_execute.side_effect = [
            maybe_future((0, "\x00".join(output) + "\x00", "")),
            maybe_future((0, "\x00".join(diff_output) + "\x00", "")),
            maybe_future(
                (0 if expected["state"] == "CHERRY_PICKING" else 128, "", "cherry pick")
            ),
            maybe_future((0 if expected["state"] == "MERGING" else 128, "", "merge")),
            maybe_future((0 if expected["state"] == "REBASING" else 128, "", "rebase")),
        ]

        # When
        actual_response = await Git().status(path=repository)

        # Then
        expected_calls = [
            call(
                ["git", "status", "--porcelain", "-b", "-u", "-z"],
                cwd=repository,
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
            call(
                [
                    "git",
                    "diff",
                    "--numstat",
                    "-z",
                    "--cached",
                    "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
                ],
                cwd=repository,
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
            call(
                ["git", "show", "--quiet", "CHERRY_PICK_HEAD"],
                cwd=repository,
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
            call(
                ["git", "show", "--quiet", "MERGE_HEAD"],
                cwd=repository,
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
            call(
                ["git", "show", "--quiet", "REBASE_HEAD"],
                cwd=repository,
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
        ]

        if expected["state"] == "CHERRY_PICKING":
            expected_calls = expected_calls[:-2]
        elif expected["state"] == "MERGING":
            expected_calls = expected_calls[:-1]

        mock_execute.assert_has_calls(expected_calls)

        assert expected == actual_response
