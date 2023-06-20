import os
import json
from pathlib import Path

import pytest


async def test_git_show_prefix(tmp_path, jp_fetch, jp_root_dir, git_repo_factory):
    # Given
    repo = git_repo_factory(jp_root_dir)
    # Check git repository is in the server directory
    assert isinstance(repo.relative_to(jp_root_dir), Path)

    # When
    response = await jp_fetch(
        "git",
        repo.relative_to(jp_root_dir).as_posix(),
        "show_prefix",
        body="{}",
        method="POST",
    )

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["path"] == ""


async def test_git_show_prefix_symlink(
    tmp_path, jp_fetch, jp_root_dir, git_repo_factory, needs_symlink
):
    # Given
    repo = git_repo_factory(tmp_path)
    # Check git repository is not in the server directory
    with pytest.raises(ValueError):
        not repo.relative_to(jp_root_dir)

    local_repo = "sym_repo"

    os.symlink(repo, jp_root_dir / local_repo, target_is_directory=True)

    assert (jp_root_dir / local_repo).exists()

    # When
    try:
        response = await jp_fetch(
            "git",
            local_repo,
            "show_prefix",
            body="{}",
            method="POST",
        )
    except Exception as e:
        print(str(e))

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["path"] == ""
