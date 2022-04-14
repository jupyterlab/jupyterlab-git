from multiprocessing import dummy
import pytest

from jupyterlab_git.git import Git


pytest.importorskip("jupytext")


@pytest.fixture
def jp_server_config(jp_server_config, tmp_path):
    main = tmp_path / "main"
    main.mkdir()
    second = tmp_path / "second"
    second.mkdir()
    return {
        "ServerApp": {
            "jpserver_extensions": {"jupyterlab_git": True, "jupytext": True},
        },
    }


@pytest.mark.parametrize(
    "filename, expected_content",
    (
        (
            "my/file.Rmd",
            """---
jupyter:
  jupytext:
    cell_markers: region,endregion
    formats: ipynb,.pct.py:percent,.lgt.py:light,.spx.py:sphinx,md,Rmd,.pandoc.md:pandoc
    text_representation:
      extension: .Rmd
      format_name: rmarkdown
      format_version: '1.1'
      jupytext_version: 1.1.0
  kernelspec:
    display_name: Python 3
    language: python
    name: python3
---

# A quick insight at world population

```{python}
a = 22
```
""",
        ),
        (
            "my/file.md",
            """---
jupyter:
  jupytext:
    cell_markers: region,endregion
    formats: ipynb,.pct.py:percent,.lgt.py:light,.spx.py:sphinx,md,Rmd,.pandoc.md:pandoc
    text_representation:
      extension: .Rmd
      format_name: rmarkdown
      format_version: '1.1'
      jupytext_version: 1.1.0
  kernelspec:
    display_name: Python 3
    language: python
    name: python3
---

# A quick insight at world population

```python
a = 22
```
""",
        ),
        (
            "my/file.myst.md",
            """---
jupyter:
  jupytext:
    cell_markers: region,endregion
    formats: ipynb,.pct.py:percent,.lgt.py:light,.spx.py:sphinx,md,Rmd,.pandoc.md:pandoc
    text_representation:
      extension: .Rmd
      format_name: rmarkdown
      format_version: '1.1'
      jupytext_version: 1.1.0
  kernelspec:
    display_name: Python 3
    language: python
    name: python3
---

# A quick insight at world population

```{code-cell} python
a = 22
```
""",
        ),
        (
            "my/file.pct.py",
            """# ---
# jupyter:
#   jupytext:
#     cell_markers: region,endregion
#     formats: ipynb,.pct.py:percent,.lgt.py:light,.spx.py:sphinx,md,Rmd,.pandoc.md:pandoc
#     text_representation:
#       extension: .py
#       format_name: percent
#       format_version: '1.2'
#       jupytext_version: 1.1.0
#   kernelspec:
#     display_name: Python 3
#     language: python
#     name: python3
# ---

# %% [markdown]
# # A quick insight at world population

# %%
a = 22
""",
        ),
    ),
)
async def test_get_content_with_jupytext(
    filename, expected_content, jp_serverapp, jp_root_dir, jp_fetch
):
    # Given
    local_path = jp_root_dir / "test_path"

    dummy_file = local_path / filename
    dummy_file.parent.mkdir(parents=True)
    dummy_file.write_text(expected_content)

    manager = Git()

    # When
    content = await manager.get_content(
        jp_serverapp.contents_manager, str(filename), str(local_path)
    )

    # Then
    assert content == expected_content
