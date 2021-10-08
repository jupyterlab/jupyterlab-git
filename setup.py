"""
jupyterlab_git setup
"""
import json
from pathlib import Path

import setuptools
from jupyter_packaging import (
    create_cmdclass,
    install_npm,
    ensure_targets,
    combine_commands,
    skip_if_exists,
)
from packaging.version import parse

HERE = Path(__file__).parent.resolve()

# The name of the project
name = "jupyterlab_git"

with (HERE / "package.json").open() as f:
    npm_data = json.load(f)
# Get the version
version = str(parse(npm_data["version"]))

lab_path = HERE / name / "labextension"

# Representative files that should exist after a successful build
jstargets = [
    str(lab_path / "package.json"),
]

package_data_spec = {name: ["*"]}

labext_name = "@jupyterlab/git"

data_files_spec = [
    ("share/jupyter/labextensions/%s" % labext_name, str(lab_path), "**"),
    ("share/jupyter/labextensions/%s" % labext_name, str(HERE), "install.json"),
    (
        "etc/jupyter/jupyter_server_config.d",
        "jupyter-config/jupyter_server_config.d",
        "jupyterlab_git.json",
    ),
    (
        "etc/jupyter/jupyter_notebook_config.d",
        "jupyter-config/jupyter_notebook_config.d",
        "jupyterlab_git.json",
    ),
]

cmdclass = create_cmdclass(
    "jsdeps", package_data_spec=package_data_spec, data_files_spec=data_files_spec
)

js_command = combine_commands(
    install_npm(HERE, build_cmd="build:prod", npm=["jlpm"]),
    ensure_targets(jstargets),
)

is_repo = (HERE / ".git").exists()
if is_repo:
    cmdclass["jsdeps"] = js_command
else:
    cmdclass["jsdeps"] = skip_if_exists(jstargets, js_command)

setup_args = dict(
    name=name,
    version=version,
    url=npm_data["homepage"],
    author=npm_data["author"],
    description=npm_data["description"],
    cmdclass=cmdclass,
    license=npm_data["license"],
    keywords=npm_data["keywords"],
)


if __name__ == "__main__":
    setuptools.setup(**setup_args)
