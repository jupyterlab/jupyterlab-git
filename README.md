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

##Installation and activation for git handler

```bash
pip install git_handler
jupyter serverextension enable --py git_handler
jupyter nbextension install --py git_handler
```

To enable this extension:

```bash
jupyter nbextension enable --py git_handler

```
