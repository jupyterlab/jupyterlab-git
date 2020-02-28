# python lib
import os
from unittest.mock import Mock, call, patch

import pytest
import tornado

# local lib
from jupyterlab_git.git import Git

from .testutils import FakeContentManager


@pytest.mark.asyncio
async def test_detailed_log():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        process_output = [
            "f29660a (HEAD, origin/feature) Commit message",
            "10      3       notebook_without_spaces.ipynb",
            "11      4       Notebook with spaces.ipynb",
            "12      5       path/notebook_without_spaces.ipynb",
            "13      6       path/Notebook with spaces.ipynb",
            " notebook_without_spaces.ipynb      | 13 ++++++++---",
            " Notebook with spaces.ipynb         | 15 +++++++++----",
            " path/notebook_without_spaces.ipynb | 17 ++++++++++-----",
            " path/Notebook with spaces.ipynb    | 19 +++++++++++------",
            " 4 files changed, 46 insertions(+), 18 deletions(-)",
        ]
        mock_execute.return_value = tornado.gen.maybe_future(
            (0, "\n".join(process_output), "")
        )

        expected_response = {
            "code": 0,
            "modified_file_note": " 4 files changed, 46 insertions(+), 18 deletions(-)",
            "modified_files_count": "4",
            "number_of_insertions": "46",
            "number_of_deletions": "18",
            "modified_files": [
                {
                    "modified_file_path": "notebook_without_spaces.ipynb",
                    "modified_file_name": "notebook_without_spaces.ipynb",
                    "insertion": "10",
                    "deletion": "3",
                },
                {
                    "modified_file_path": "Notebook with spaces.ipynb",
                    "modified_file_name": "Notebook with spaces.ipynb",
                    "insertion": "11",
                    "deletion": "4",
                },
                {
                    "modified_file_path": "path/notebook_without_spaces.ipynb",
                    "modified_file_name": "notebook_without_spaces.ipynb",
                    "insertion": "12",
                    "deletion": "5",
                },
                {
                    "modified_file_path": "path/Notebook with spaces.ipynb",
                    "modified_file_name": "Notebook with spaces.ipynb",
                    "insertion": "13",
                    "deletion": "6",
                },
            ],
        }

        # When
        actual_response = (await 
            Git(FakeContentManager("/bin"))
            .detailed_log(
                selected_hash="f29660a2472e24164906af8653babeb48e4bf2ab",
                current_path="test_curr_path",
            )
        )

        # Then
        mock_execute.assert_called_once_with(
            [
                "git",
                "log",
                "-1",
                "--stat",
                "--numstat",
                "--oneline",
                "f29660a2472e24164906af8653babeb48e4bf2ab",
            ],
            cwd=os.path.join("/bin", "test_curr_path"),
        )

        assert expected_response == actual_response
