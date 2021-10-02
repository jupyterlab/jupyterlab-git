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
            "0	1	folder/test.txt\x00\x00e6d4eed300811e886cadffb16eeed19588eb5eec",
            "Lazy Senior Developer",
            "18 hours ago",
            "move test.txt to folder/test.txt",
            "0	0	\x00test.txt\x00folder/test.txt\x00\x00263f762e0aad329c3c01bbd9a28f66403e6cfa5f",
            "Lazy Senior Developer",
            "18 hours ago",
            "append more to test.txt",
            "1	0	test.txt\x00\x00d19001d71bb928ec9ed6ae3fe1bfc474e1b771d0",
            "Lazy Senior Developer",
            "18 hours ago",
            "add test.txt to root",
            "1	0	test.txt\x00",
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
                    "pre_commit": "e6d4eed300811e886cadffb16eeed19588eb5eec",
                    "is_binary": False,
                    "file_path": "folder/test.txt",
                },
                {
                    "commit": "e6d4eed300811e886cadffb16eeed19588eb5eec",
                    "author": "Lazy Senior Developer",
                    "date": "18 hours ago",
                    "commit_msg": "move test.txt to folder/test.txt",
                    "pre_commit": "263f762e0aad329c3c01bbd9a28f66403e6cfa5f",
                    "is_binary": False,
                    "file_path": "folder/test.txt",
                    "previous_file_path": "test.txt",
                },
                {
                    "commit": "263f762e0aad329c3c01bbd9a28f66403e6cfa5f",
                    "author": "Lazy Senior Developer",
                    "date": "18 hours ago",
                    "commit_msg": "append more to test.txt",
                    "pre_commit": "d19001d71bb928ec9ed6ae3fe1bfc474e1b771d0",
                    "is_binary": False,
                    "file_path": "test.txt",
                },
                {
                    "commit": "d19001d71bb928ec9ed6ae3fe1bfc474e1b771d0",
                    "author": "Lazy Senior Developer",
                    "date": "18 hours ago",
                    "commit_msg": "add test.txt to root",
                    "pre_commit": "",
                    "is_binary": False,
                    "file_path": "test.txt",
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
                "--pretty=format:%H%n%an%n%ar%n%s",
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
