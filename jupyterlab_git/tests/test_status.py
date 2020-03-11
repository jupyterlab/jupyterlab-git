# python lib
import os
from unittest.mock import Mock, call, patch

import pytest
import tornado

# local lib
from jupyterlab_git.git import Git

from .testutils import FakeContentManager

@pytest.mark.asyncio
async def test_changed_files_index():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        process_output = (
        "A  notebook with spaces.ipynb",
        "M  notebook with λ.ipynb",
        "R  renamed_to_θ.py",
        "originally_named_π.py",
        "?? untracked.ipynb",
        )

        expected_resonse = [
            {"x": "A", "y": " ", "to": "notebook with spaces.ipynb", "from": "notebook with spaces.ipynb"},
            {"x": "M", "y": " ", "to": "notebook with λ.ipynb", "from": "notebook with λ.ipynb"},
            {"x": "R", "y": " ", "to": "renamed_to_θ.py", "from": "originally_named_π.py"},
            {"x": "?", "y": "?", "to": "untracked.ipynb", "from": "untracked.ipynb"},
        ]
        mock_execute.return_value = tornado.gen.maybe_future(
            (0, "\x00".join(process_output), "")

        )

        # When
        actual_response = await Git(FakeContentManager("/bin")).status(
            current_path="test_curr_path"
        )

        # Then
        mock_execute.assert_called_once_with(
            ["git", "status", "--porcelain" , "-u", "-z"], cwd="/bin/test_curr_path"
        )

        assert {"code": 0, "files": expected_resonse} == actual_response
