import pytest
from unittest.mock import patch

from jupyterlab_git.git import execute, execution_lock


@pytest.mark.asyncio
async def test_execute_waits_on_index_lock(tmp_path):
    lock_file = tmp_path / ".git/index.lock"
    lock_file.parent.mkdir(parents=True, exist_ok=True)
    lock_file.write_text("")

    async def remove_lock_file(*args):
        assert "unlocked" not in repr(execution_lock)  # Check that the lock is working
        lock_file.unlink()  # Raise an error for missing file

    with patch("tornado.gen.sleep") as sleep:
        sleep.side_effect = remove_lock_file  # Remove the lock file instead of sleeping

        assert "unlock" in repr(execution_lock)
        cmd = ["git", "dummy"]
        kwargs = {"cwd": "{!s}".format(tmp_path)}
        await execute(cmd, **kwargs)
        assert "unlock" in repr(execution_lock)

        assert not lock_file.exists()
        assert sleep.call_count == 1
