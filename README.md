# jupyterlab-git
pre-alpha version


JLG


## Prerequisites

* JupyterLab

## Installation for git-plugin

```bash
jupyter labextension install jupyterlab-git
```

## Development

For a development install (requires npm version 4 or later), do the following in the repository directory:

```bash
npm install
jupyter labextension link .
```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```

##Installation and activation for jupyterlab_git python handler package

```bash
pip install jupyterlab_git
jupyter serverextension enable --py jupyterlab_git
jupyter nbextension install --py jupyterlab_git
```

To enable this extension:

```bash
jupyter nbextension enable --py jupyterlab_git

```
