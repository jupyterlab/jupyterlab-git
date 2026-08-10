import anyio
import pytest
from unittest.mock import patch
from jupyterlab_git_core.git import Git, _get_execution_lock


class _TinyTimeoutConfig:
    """Minimal config stand-in exposing only what Git.__init__ reads."""

    git_command_timeout = 0.01


class _CancelScopeWithoutCancelledCaught:
    """Wraps a real anyio CancelScope but hides ``cancelled_caught``.

    anyio 3.0.0's CancelScope only exposes ``cancel_called``; the
    ``cancelled_caught`` property was added in a later anyio release and is
    present (alongside ``cancel_called``) in this environment's installed
    anyio (4.x), which is why a plain regression test using the real
    CancelScope cannot distinguish the fixed code from the old,
    ``cancelled_caught``-reading code. This wrapper simulates anyio 3.0.0's
    actual attribute surface so the test genuinely exercises the
    AttributeError path when the old attribute name is used.
    """

    def __init__(self, real_scope):
        self._real_scope = real_scope

    def __getattr__(self, name):
        if name == "cancelled_caught":
            raise AttributeError(
                "'CancelScope' object has no attribute 'cancelled_caught'"
            )
        return getattr(self._real_scope, name)

    def __enter__(self):
        self._real_scope.__enter__()
        return self

    def __exit__(self, *args):
        return self._real_scope.__exit__(*args)


@pytest.mark.anyio
async def test_execute_lock_timeout_uses_cancel_called(tmp_path):
    """Regression test for #1520.

    anyio 3.0.0's CancelScope only has ``cancel_called``; ``cancelled_caught``
    was added later and happens to also exist on the anyio version installed
    in this environment, so testing against the real CancelScope would pass
    regardless of which attribute name __execute reads. To make the test
    actually able to fail on the old code, we patch anyio.move_on_after to
    return a scope object that raises AttributeError on ``cancelled_caught``
    access, mirroring anyio 3.0.0's real attribute surface. If __execute were
    reverted to read ``scope.cancelled_caught``, this test would fail with an
    AttributeError instead of returning the expected lock-timeout result.
    """
    git = Git(config=_TinyTimeoutConfig())
    lock = _get_execution_lock()
    release_event = anyio.Event()

    real_move_on_after = anyio.move_on_after

    def fake_move_on_after(*args, **kwargs):
        return _CancelScopeWithoutCancelledCaught(
            real_move_on_after(*args, **kwargs)
        )

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
        with patch("anyio.move_on_after", side_effect=fake_move_on_after):
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
