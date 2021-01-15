from pathlib import Path
from subprocess import CalledProcessError
from unittest.mock import Mock, call, patch

import pytest
import tornado

# local lib
from jupyterlab_git.git import Git

from .testutils import FakeContentManager, maybe_future


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "output,diff_output,expected",
    [
        (
            (
                "## master",
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
                "branch": "master",
                "remote": None,
                "ahead": 0,
                "behind": 0,
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
            ("## master",),
            (""),
            {
                "code": 0,
                "branch": "master",
                "remote": None,
                "ahead": 0,
                "behind": 0,
                "files": [],
            },
        ),
        # With upstream only
        (
            ("## master...origin/master",),
            (""),
            {
                "code": 0,
                "branch": "master",
                "remote": "origin/master",
                "ahead": 0,
                "behind": 0,
                "files": [],
            },
        ),
        # Ahead only
        (
            ("## master...origin/master [ahead 15]",),
            (""),
            {
                "code": 0,
                "branch": "master",
                "remote": "origin/master",
                "ahead": 15,
                "behind": 0,
                "files": [],
            },
        ),
        # Behind only
        (
            ("## master...origin/master [behind 5]",),
            (""),
            {
                "code": 0,
                "branch": "master",
                "remote": "origin/master",
                "ahead": 0,
                "behind": 5,
                "files": [],
            },
        ),
        # Ahead and behind
        (
            ("## master...origin/master [ahead 3, behind 5]",),
            (""),
            {
                "code": 0,
                "branch": "master",
                "remote": "origin/master",
                "ahead": 3,
                "behind": 5,
                "files": [],
            },
        ),
        # Initial commit
        (
            ("## No commits yet on master",),
            (""),
            {
                "code": 0,
                "branch": "(initial)",
                "remote": None,
                "ahead": 0,
                "behind": 0,
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
                "files": [],
            },
        ),
    ],
)
async def test_status(output, diff_output, expected):
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        root = Path("/bin")
        repository = "test_curr_path"
        mock_execute.side_effect = [
            maybe_future((0, "\x00".join(output) + "\x00", "")),
            maybe_future((0, "\x00".join(diff_output) + "\x00", "")),
        ]

        # When
        actual_response = await Git(FakeContentManager(root)).status(
            current_path=repository
        )

        # Then
        mock_execute.assert_has_calls(
            [
                call(
                    ["git", "status", "--porcelain", "-b", "-u", "-z"],
                    cwd=str(root / repository),
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
                    cwd=str(root / repository),
                ),
            ]
        )

        assert expected == actual_response
