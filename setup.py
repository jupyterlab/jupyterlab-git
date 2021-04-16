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

# Get our version
with (HERE / "package.json").open() as f:
    version = str(parse(json.load(f)["version"]))

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

long_description = (HERE / "README.md").read_text(errors="ignore")

setup_args = dict(
    name=name,
    version=version,
    url="https://github.com/jupyterlab/jupyterlab-git.git",
    author="Jupyter Development Team",
    description="A JupyterLab extension for version control using git",
    long_description=long_description,
    long_description_content_type="text/markdown",
    cmdclass=cmdclass,
    packages=setuptools.find_packages(),
    install_requires=[
        "jupyter_server",
        "nbdime~=3.0",
        "nbformat",
        "packaging",
        "pexpect",
    ],
    zip_safe=False,
    include_package_data=True,
    python_requires=">=3.6,<4",
    license="BSD-3-Clause",
    platforms="Linux, Mac OS X, Windows",
    keywords=["Jupyter", "JupyterLab", "JupyterLab3", "Git"],
    classifiers=[
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: BSD License",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Framework :: Jupyter",
    ],
    extras_require={
        "dev": [
            "black",
            "coverage",
            "jupyter_packaging~=0.7.9",
            "jupyterlab~=3.0",
            "pre-commit",
            "pytest",
            "pytest-asyncio",
            "pytest-cov",
            "pytest-tornasync",
        ],
    },
)


if __name__ == "__main__":
    setuptools.setup(**setup_args)
