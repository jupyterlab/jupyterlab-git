import anyio
import pytest
from unittest.mock import patch
from jupyterlab_git_core.git import Git, _get_execution_lock


class _TinyTimeoutConfig:
    """Minimal config stand-in exposing only what Git.__init__ reads."""

    git_command_timeout = 0.01


@pytest.mark.anyio
async def test_execute_lock_timeout_uses_cancel_called(tmp_path):
    """Regression test for #1520.

    anyio 3 renamed CancelScope.cancelled_caught to CancelScope.cancel_called.
    When the lock cannot be acquired before the timeout, __execute must read
    the new attribute name instead of raising AttributeError (which was
    previously being swallowed and surfaced as a None return / false
    "git command not found" error).
    """
    git = Git(config=_TinyTimeoutConfig())
    lock = _get_execution_lock()
    release_event = anyio.Event()

    async def hold_lock(*, task_status):
        async with lock:
            task_status.started()
            await release_event.wait()

    # Hold the lock from a separate task so that __execute's own acquire()
    # call is forced to wait past the (very short) timeout and the anyio
    # CancelScope actually fires.
    async with anyio.create_task_group() as tg:
        await tg.start(hold_lock)

        cmd = ["git", "dummy"]
        result = await git._Git__execute(cmd, cwd=str(tmp_path))

        release_event.set()

    # No AttributeError was raised, and we get the expected lock-timeout
    # result rather than None.
    assert result == (1, "", "Unable to get the lock on the directory")


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
