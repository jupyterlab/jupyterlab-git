# python lib
import os
from unittest.mock import Mock, call, patch

import pytest
import tornado

# local lib
from jupyterlab_git.git import Git

from .testutils import FakeContentManager


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "output,expected",
    [
        (
            (
                "A  notebook with spaces.ipynb",
                "M  notebook with λ.ipynb",
                "R  renamed_to_θ.py",
                "originally_named_π.py",
                "?? untracked.ipynb",
            ),
            [
                {
                    "x": "A",
                    "y": " ",
                    "to": "notebook with spaces.ipynb",
                    "from": "notebook with spaces.ipynb",
                },
                {
                    "x": "M",
                    "y": " ",
                    "to": "notebook with λ.ipynb",
                    "from": "notebook with λ.ipynb",
                },
                {
                    "x": "R",
                    "y": " ",
                    "to": "renamed_to_θ.py",
                    "from": "originally_named_π.py",
                },
                {
                    "x": "?",
                    "y": "?",
                    "to": "untracked.ipynb",
                    "from": "untracked.ipynb",
                },
            ],
        ),
        ((""), ([])),  # Empty answer
    ],
)
async def test_status(output, expected):
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        root = "/bin"
        repository = "test_curr_path"
        mock_execute.return_value = tornado.gen.maybe_future(
            (0, "\x00".join(output)+"\x00", "")
        )

        # When
        actual_response = await Git(FakeContentManager(root)).status(
            current_path=repository
        )

        # Then
        mock_execute.assert_called_once_with(
            ["git", "status", "--porcelain", "-u", "-z"],
            cwd=os.path.join(root, repository),
        )

        assert {"code": 0, "files": expected} == actual_response
