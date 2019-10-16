# jupyterlab-git

[![Binder](https://beta.mybinder.org/badge.svg)](https://mybinder.org/v2/gh/jupyterlab/jupyterlab-git/master?urlpath=lab) [![Build Status](https://travis-ci.org/jupyterlab/jupyterlab-git.svg?branch=master)](https://travis-ci.org/jupyterlab/jupyterlab-git) [![Version](https://img.shields.io/npm/v/@jupyterlab/git.svg)](https://www.npmjs.com/package/@jupyterlab/git) [![Version](https://img.shields.io/pypi/v/jupyterlab-git.svg)](https://pypi.org/project/jupyterlab-git/) [![Downloads](https://img.shields.io/npm/dm/@jupyterlab/git.svg)](https://www.npmjs.com/package/@jupyterlab/git) [![Version](https://img.shields.io/conda/vn/conda-forge/jupyterlab-git.svg)](https://anaconda.org/conda-forge/jupyterlab-git) [![Downloads](https://img.shields.io/conda/dn/conda-forge/jupyterlab-git.svg)](https://anaconda.org/conda-forge/jupyterlab-git)


A JupyterLab extension for version control using git

![](http://g.recordit.co/N9Ikzbyk8P.gif)

## Prerequisites

- JupyterLab  

## Usage

- Open the git extension from the *Git* tab on the left panel

## Install

To install perform the following steps:

```bash
pip install --upgrade jupyterlab-git
jupyter lab build
```

## Development

### Contributing

If you would like to contribute to the project, please read our [contributor documentation](https://github.com/jupyterlab/jupyterlab/blob/master/CONTRIBUTING.md).

JupyterLab follows the official [Jupyter Code of Conduct](https://github.com/jupyter/governance/blob/master/conduct/code_of_conduct.md).

### Team

The Jupyter Git extension is part of [Project Jupyter](http://jupyter.org/) and is developed by an open community of contributors. Our maintainer team is accompanied by a much larger group of contributors to JupyterLab and Project Jupyter as a whole.

JupyterLab Git's current maintainers are listed in alphabetical order, with affiliation, and main areas of contribution:

- Brian Granger, Cal Poly (co-creator, strategy, vision, management, UI/UX design,
  architecture).
- Saul Shanabrook, Quansight(software engineering)
- Jaipreet Singh, AWS (software engineering, UI/UX design, management)
- Frederic Collonval, Safran Group (software engineering)

A lot of awesome people have contributed to this repo  - See the contributors tab for more details!


This list is provided to help provide context about who we are and how our team functions.
If you would like to be listed, please submit a pull request with your information.

### Install

Requires node 4+ and npm 4+

```bash
# Clone the repo to your local environment
git clone https://github.com/jupyterlab/jupyterlab-git.git
cd jupyterlab-git
# Install JupyterLab
pip install jupyterlab
# Install Javascript dependencies
jlpm install
# Install the server extension in development mode
pip install -e .[test]
jupyter serverextension enable --py jupyterlab_git
# Link your development version of the extension with JupyterLab
jupyter labextension link .
```

To rebuild the package after a change and the JupyterLab app:

```bash
jlpm run build
jupyter lab build
```

To execute the tests

```bash
pytest jupyterlab_git
jlpm run test
```