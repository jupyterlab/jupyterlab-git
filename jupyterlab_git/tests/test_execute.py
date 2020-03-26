import pytest
import tornado
from unittest.mock import MagicMock, patch, DEFAULT

from jupyterlab_git.git import execute


@pytest.mark.asyncio
async def test_execute_waits_on_index_lock():
    lock_exists = False

    def does_lockfile_exist(p):
        if lock_exists and p == "/dummy/path/.git/index.lock":
            return True

        return DEFAULT

    def success_when_no_lock(*args, **kwargs):
        if lock_exists:
            return tornado.gen.maybe_future((1, "", "Lock found"))

        return tornado.gen.maybe_future((0, "", ""))

    with patch("tornado.ioloop.IOLoop.current") as executor:
        executor.return_value = MagicMock(
            **({"run_in_executor.side_effect": success_when_no_lock})
        )
        # Dont really sleep as this is a unit test
        with patch("tornado.gen.sleep") as sleep:
            sleep.return_value = tornado.gen.maybe_future(None)

            with patch("os.path.exists") as path_exists:
                path_exists.side_effect = does_lockfile_exist
                cmd = ["git", "dummy"]
                kwargs = {"cwd": "/dummy/path"}
                answer1 = await execute(cmd, **kwargs)
                executor.assert_called_once()

                # Simulate answer1 not having released lock
                lock_exists = True
                answer2 = await execute(cmd, **kwargs)

                assert executor.call_count == 2
                assert answer1[0] == 0
                assert answer2[0] == 1
                # Did we really try to wait on the lock?
                sleep.assert_called()
