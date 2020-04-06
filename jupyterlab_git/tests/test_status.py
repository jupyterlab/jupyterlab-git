# python lib
import os
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
            [
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
        ),
        ((""), (""), ([])),  # Empty answer
    ],
)
async def test_status(output, diff_output, expected):
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        root = "/bin"
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
                    ["git", "status", "--porcelain", "-u", "-z"],
                    cwd=os.path.join(root, repository),
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
                    cwd=os.path.join(root, repository),
                ),
            ]
        )

        assert {"code": 0, "files": expected} == actual_response
