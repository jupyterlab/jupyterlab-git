# jupyterlab-git
pre-alpha version


JLG


## Prerequisites

* JupyterLab

## Installation for git-plugin

```bash
jupyter labextension install jupyterlab-git
```
## npm install
go to the ```jupyterlab-git``` directory in  the terminal &  use ``` npm install ``` to install all the necessary modules.


## Installation and activation of git handler

```bash
pip install git_handler/
jupyter serverextension enable --py git_handler
jupyter nbextension install --py git_handler
```


To enable this extension:

```bash
jupyter nbextension enable --py git_handler

```

Launch JupyterLab & you will see the new Git buttons on the left side of the window.

