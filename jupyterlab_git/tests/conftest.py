# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.
#
# Inspired by nbdime conftest

import os
import shlex
import shutil
import sys
from pathlib import Path
from subprocess import check_call
from typing import Callable, Dict, List, Union

from pytest import fixture, skip

FILES_PATH = Path(__file__).parent / "files"


def call(cmd: Union[str, List[str]], cwd: Union[str, Path, None] = None) -> int:
    """Call a command
    if str, split into command list
    """
    if isinstance(cmd, str):
        cmd = shlex.split(cmd)
    return check_call(cmd, stdout=sys.stdout, stderr=sys.stderr, cwd=cwd)


@fixture(scope="session")
def needs_symlink(tmp_path_factory):
    if not hasattr(os, "symlink"):
        skip("requires symlink creation")
    tdir = tmp_path_factory.mktemp("check-symlinks")
    source = tdir / "source"
    source.mkdir()
    try:
        os.symlink(source, tdir / "link")
    except OSError:
        skip("requires symlink creation")


@fixture
def git_repo_factory() -> Callable[[Path], Path]:
    def factory(root_path: Path) -> Path:
        repo = root_path / "repo"
        repo.mkdir()

        call("git init", cwd=repo)

        # setup base branch
        src = FILES_PATH

        def copy(files):
            for s, d in files:
                shutil.copy(src / s, repo / d)

        copy(
            [
                ["multilevel-test-base.ipynb", "merge-no-conflict.ipynb"],
                ["inline-conflict--1.ipynb", "merge-conflict.ipynb"],
                ["src-and-output--1.ipynb", "diff.ipynb"],
            ]
        )

        call("git add *.ipynb", cwd=repo)
        call("git config user.name 'JupyterLab Git'", cwd=repo)
        call("git config user.email 'jlab.git@py.test'", cwd=repo)
        call('git commit -m "init base branch"', cwd=repo)
        # create base alias for master
        call("git checkout -b base master", cwd=repo)

        # setup local branch
        call("git checkout -b local master", cwd=repo)
        copy(
            [
                ["multilevel-test-local.ipynb", "merge-no-conflict.ipynb"],
                ["inline-conflict--2.ipynb", "merge-conflict.ipynb"],
                ["src-and-output--2.ipynb", "diff.ipynb"],
            ]
        )
        call('git commit -am "create local branch"', cwd=repo)

        # setup remote branch with conflict
        call("git checkout -b remote-conflict master", cwd=repo)
        copy([["inline-conflict--3.ipynb", "merge-conflict.ipynb"]])
        call('git commit -am "create remote with conflict"', cwd=repo)

        # setup remote branch with no conflict
        call("git checkout -b remote-no-conflict master", cwd=repo)
        copy([["multilevel-test-remote.ipynb", "merge-no-conflict.ipynb"]])
        call('git commit -am "create remote with no conflict"', cwd=repo)

        # start on local
        call("git checkout local", cwd=repo)
        assert not Path(repo / ".gitattributes").exists()
        return repo

    return factory
