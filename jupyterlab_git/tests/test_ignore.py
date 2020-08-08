import pytest

from jupyterlab_git.git import Git

from .testutils import FakeContentManager, maybe_future


@pytest.mark.parametrize("ignore_content", [None, "dummy", "dummy\n"])
@pytest.mark.asyncio
async def test_ensure_gitignore(tmp_path, ignore_content):
    # Given
    ignore_file = tmp_path / ".gitignore"
    if ignore_content is not None:
        ignore_file.write_text(ignore_content)

    # When
    actual_response = await Git(FakeContentManager("/bin")).ensure_gitignore(
        str(tmp_path)
    )

    # Then
    assert {"code": 0} == actual_response
    content = ignore_file.read_text()
    assert len(content) == 0 or content.endswith("\n")


@pytest.mark.asyncio
async def test_ensure_gitignore_failure(tmp_path):
    # Given
    ignore_file = tmp_path / ".gitignore"
    ignore_file.write_text("dummy")
    ignore_file.chmod(200)  # Set read only to generate an error

    # When
    response = await Git(FakeContentManager("/bin")).ensure_gitignore(str(tmp_path))

    # Then
    assert response["code"] == -1


@pytest.mark.asyncio
async def test_ignore(tmp_path):
    # Given
    ignore_file = tmp_path / ".gitignore"
    ignore_file.write_text("dummy")
    file_ignore = "to_ignore.txt"

    # When
    response = await Git(FakeContentManager("/bin")).ignore(str(tmp_path), file_ignore)

    # Then
    assert {"code": 0} == response
    content = ignore_file.read_text()
    content.endswith("{}\n".format(file_ignore))


@pytest.mark.asyncio
async def test_ignore_failure(tmp_path):
    # Given
    ignore_file = tmp_path / ".gitignore"
    ignore_file.write_text("dummy")
    ignore_file.chmod(200)  # Set read only to generate an error

    # When
    response = await Git(FakeContentManager("/bin")).ignore(
        str(tmp_path), "to_ignore.txt"
    )

    # Then
    assert response["code"] == -1
