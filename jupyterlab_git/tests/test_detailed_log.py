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
        process_output_first_half = [
            "f29660a (HEAD, origin/feature) Commit message",
            "10\t3\tnotebook_without_spaces.ipynb",
            "11\t4\tNotebook with spaces.ipynb",
            "12\t5\tpath/notebook_without_spaces.ipynb",
            "13\t6\tpath/Notebook with spaces.ipynb",
            "14\t1\tpath/Notebook with λ.ipynb",
        ]
        process_output_second_half = [
            " notebook_without_spaces.ipynb      | 13 ++++++++---",
            " Notebook with spaces.ipynb         | 15 +++++++++----",
            " path/notebook_without_spaces.ipynb | 17 ++++++++++-----",
            " path/Notebook with spaces.ipynb    | 19 +++++++++++------",
            " path/Notebook with λ.ipynb         | 15 +++++++++++-",
            " 5 files changed, 50 insertions(+), 19 deletions(-)",
        ]
        process_output_first_half = "\x00".join(process_output_first_half)
        process_output_second_half = "\n".join(process_output_second_half)
        process_output = process_output_first_half + "\x00" + process_output_second_half
        mock_execute._mock_return_value = tornado.gen.maybe_future(
            (0, process_output, "")
        )

        expected_response = {
            "code": 0,
            "modified_file_note": " 5 files changed, 50 insertions(+), 19 deletions(-)",
            "modified_files_count": "5",
            "number_of_insertions": "50",
            "number_of_deletions": "19",
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
                {
                    "modified_file_path": "path/Notebook with λ.ipynb",
                    "modified_file_name": "Notebook with λ.ipynb",
                    "insertion": "14",
                    "deletion": "1",
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
                "-z",
                "f29660a2472e24164906af8653babeb48e4bf2ab",
            ],
            cwd=os.path.join("/bin", "test_curr_path"),
        )

        assert expected_response == actual_response
