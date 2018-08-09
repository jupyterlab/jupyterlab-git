# jupyterlab-git

[![Binder](https://beta.mybinder.org/badge.svg)](https://mybinder.org/v2/gh/jupyterlab/jupyterlab-git/master?urlpath=lab)

A JupyterLab extension for version control using git

![](http://g.recordit.co/N9Ikzbyk8P.gif)

## Prerequisites

- JupyterLab  

## Usage

- Open the git extension from the *Git* tab on the left panel

## Install

```bash
jupyter labextension install @jupyterlab/git
```

```bash
pip install jupyterlab-git
jupyter serverextension enable --py jupyterlab_git
```

## Development

### Contributing

If you would like to contribute to the project, please read our [contributor documentation](https://github.com/jupyterlab/jupyterlab/blob/master/CONTRIBUTING.md).

JupyterLab follows the official [Jupyter Code of Conduct](https://github.com/jupyter/governance/blob/master/conduct/code_of_conduct.md).

### Install

Requires node 4+ and npm 4+

```bash
# Clone the repo to your local environment
git clone https://github.com/jupyterlab/jupyterlab-git.git
cd jupyterlab-git
# Install dependencies
npm install # or yarn
# Build Typescript source
npm run build # or yarn build
# Link your development version of the extension with JupyterLab
jupyter labextension link .
# Rebuild Typescript source after making changes
npm run build # or yarn build
```

```bash
pip install .
jupyter serverextension enable --py jupyterlab_git
```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```


