from pathlib import Path
from unittest.mock import patch

import pytest

from jupyterlab_git.git import Git

from .testutils import maybe_future


@pytest.mark.asyncio
async def test_single_file_log():
    with patch("jupyterlab_git.git.execute") as mock_execute:
        # Given
        process_output = [
            "8852729159bef63d7197f8aa26355b387283cb58",
            "Lazy Senior Developer",
            "2 hours ago",
            "Something",
            "e6d4eed300811e886cadffb16eeed19588eb5eec\x00\x00e6d4eed300811e886cadffb16eeed19588eb5eec"
            "\x00folder/test.txt\x00",
            "d19001d71bb928ec9ed6ae3fe1bfc474e1b771d0",
            "Lazy Junior Developer",
            "5 hours ago",
            "Something More",
            "263f762e0aad329c3c01bbd9a28f66403e6cfa5f\x00\x00263f762e0aad329c3c01bbd9a28f66403e6cfa5f"
            "\x00folder/test.txt\x00",
        ]

        mock_execute.return_value = maybe_future((0, "\n".join(process_output), ""))

        expected_response = {
            "code": 0,
            "commits": [
                {
                    "commit": "8852729159bef63d7197f8aa26355b387283cb58",
                    "author": "Lazy Senior Developer",
                    "date": "2 hours ago",
                    "commit_msg": "Something",
                    "pre_commits": ["e6d4eed300811e886cadffb16eeed19588eb5eec"],
                    "is_binary": False,
                    "file_path": "folder/test.txt",
                },
                {
                    "commit": "d19001d71bb928ec9ed6ae3fe1bfc474e1b771d0",
                    "author": "Lazy Junior Developer",
                    "date": "5 hours ago",
                    "commit_msg": "Something More",
                    "pre_commits": ["263f762e0aad329c3c01bbd9a28f66403e6cfa5f"],
                    "is_binary": False,
                    "file_path": "folder/test.txt",
                },
            ],
        }

        # When
        actual_response = await Git().log(
            path=str(Path("/bin/test_curr_path")),
            history_count=25,
            follow_path="folder/test.txt",
        )

        # Then
        mock_execute.assert_called_once_with(
            [
                "git",
                "log",
                "--pretty=format:%H%n%an%n%ar%n%s%n%P",
                "-25",
                "-z",
                "--numstat",
                "--follow",
                "--",
                "folder/test.txt",
            ],
            cwd=str(Path("/bin") / "test_curr_path"),
        )

        assert expected_response == actual_response
