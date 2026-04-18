import pytest
from unittest.mock import patch
from jupyterlab_git_core.git import Git, _get_execution_lock


@pytest.mark.anyio
async def test_execute_waits_on_index_lock(tmp_path):
    lock_file = tmp_path / ".git/index.lock"
    lock_file.parent.mkdir(parents=True, exist_ok=True)
    lock_file.write_text("")

    git = Git()
    lock = _get_execution_lock()

    async def remove_lock_file(*args):
        assert lock.locked()  # Check that the lock is working
        lock_file.unlink()

    # Remove the lock file instead of sleeping
    with patch("anyio.sleep", side_effect=remove_lock_file) as sleep_mock:
        cmd = ["git", "dummy"]
        await git._Git__execute(cmd, cwd=str(tmp_path))

        assert not lock.locked()
        assert not lock_file.exists()
        assert sleep_mock.call_count == 1
