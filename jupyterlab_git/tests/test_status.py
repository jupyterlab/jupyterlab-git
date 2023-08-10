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
                "state": 0,
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
                "state": 0,
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
                "state": 0,
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
                "state": 0,
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
                "state": 0,
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
                "state": 0,
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
                "state": 0,
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
                "state": 1,
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
                "state": 4,
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
                "state": 3,
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
                "state": 0,
            },
        ),
    ],
)
async def test_status(tmp_path, output, diff_output, expected):
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        repository = tmp_path / "test_curr_path"
        (repository / ".git" / "rebase-merge").mkdir(parents=True)

        mock_execute.side_effect = [
            maybe_future((0, "\x00".join(output) + "\x00", "")),
            maybe_future((0, "\x00".join(diff_output) + "\x00", "")),
            maybe_future((0 if expected["state"] == 4 else 128, "", "cherry pick")),
            maybe_future((0 if expected["state"] == 2 else 128, "", "merge")),
            maybe_future(
                (0 if expected["state"] == 3 else 128, ".git/rebase-merge", "rebase")
            ),
            maybe_future(
                (0 if expected["state"] == 3 else 128, ".git/rebase-apply", "rebase")
            ),
        ]

        # When
        actual_response = await Git().status(path=str(repository))

        # Then
        expected_calls = [
            call(
                ["git", "status", "--porcelain", "-b", "-u", "-z"],
                cwd=str(repository),
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
                cwd=str(repository),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
            call(
                ["git", "show", "--quiet", "CHERRY_PICK_HEAD"],
                cwd=str(repository),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
            call(
                ["git", "show", "--quiet", "MERGE_HEAD"],
                cwd=str(repository),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
            call(
                ["git", "rev-parse", "--git-path", "rebase-merge"],
                cwd=str(repository),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
            call(
                ["git", "rev-parse", "--git-path", "rebase-apply"],
                cwd=str(repository),
                timeout=20,
                env=None,
                username=None,
                password=None,
                is_binary=False,
            ),
        ]

        if expected["state"] == 4:
            expected_calls = expected_calls[:-3]
        elif expected["state"] == 2:
            expected_calls = expected_calls[:-2]
        elif expected["state"] == 3:
            expected_calls = expected_calls[:-1]

        mock_execute.assert_has_calls(expected_calls)

        assert expected == actual_response
