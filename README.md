# jupyterlab-git


JLG


## Prerequisites

* JupyterLab

## Installation

```bash
jupyter labextension install jupyterlab-git
```

## Development

For a development install (requires npm version 4 or later), do the following in the repository directory:

```bash
npm install
jupyter labextension link .
```
to install the server extension, go inside the git_handler directory and do the following:
```bash
pip install ./hi
```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```

Launch JupyterLab & you will see the new Git buttons on the left side of the window.
