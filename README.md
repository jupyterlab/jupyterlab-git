# jupyterlab-git

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jupyterlab/jupyterlab-git/master?urlpath=lab/tree/examples/demo.ipynb) [![Build Status](https://travis-ci.org/jupyterlab/jupyterlab-git.svg?branch=master)](https://travis-ci.org/jupyterlab/jupyterlab-git) [![Version](https://img.shields.io/npm/v/@jupyterlab/git.svg)](https://www.npmjs.com/package/@jupyterlab/git) [![Version](https://img.shields.io/pypi/v/jupyterlab-git.svg)](https://pypi.org/project/jupyterlab-git/) [![Downloads](https://img.shields.io/npm/dm/@jupyterlab/git.svg)](https://www.npmjs.com/package/@jupyterlab/git) [![Version](https://img.shields.io/conda/vn/conda-forge/jupyterlab-git.svg)](https://anaconda.org/conda-forge/jupyterlab-git) [![Downloads](https://img.shields.io/conda/dn/conda-forge/jupyterlab-git.svg)](https://anaconda.org/conda-forge/jupyterlab-git)

A JupyterLab extension for version control using Git

![](http://g.recordit.co/N9Ikzbyk8P.gif)

To see the extension in action, open the example notebook included in the Binder [demo](https://mybinder.org/v2/gh/jupyterlab/jupyterlab-git/master?urlpath=lab/tree/examples/demo.ipynb).

## Prerequisites

- JupyterLab
- Git (version `>=1.7.4`)

## Usage

- Open the Git extension from the _Git_ tab on the left panel

## Install

To install perform the following steps:

```bash
pip install --upgrade jupyterlab-git
jupyter lab build
```

## Settings

Once installed, extension behavior can be modified via the following settings which can be set in JupyterLab's advanced settings editor:

-   **disableBranchWithChanges**: disable all branch operations, such as creating a new branch or switching to a different branch, when there are changed/staged files. When set to `true`, this setting guards against overwriting and/or losing uncommitted changes.
-   **historyCount**: number of commits shown in the history log, beginning with the most recent. Displaying a larger number of commits can lead to performance degradation, so use caution when modifying this setting.
-   **refreshInterval**: number of milliseconds between polling the file system for changes. In order to ensure that the UI correctly displays the current repository status, the extension must poll the file system for changes. Longer polling times increase the likelihood that the UI does not reflect the current status; however, longer polling times also incur less performance overhead.
-   **simpleStaging**: enable a simplified concept of staging. When this setting is `true`, all files with changes are automatically staged. When we develop in JupyterLab, we often only care about what files have changed (in the broadest sense) and don't need to distinguish between "tracked" and "untracked" files. Accordingly, this setting allows us to simplify the visual presentation of changes, which is especially useful for those less acquainted with Git.

### Troubleshooting

Before consulting the following list, be sure the server extension and the frontend extension have the same version by executing the following commands:

```bash
jupyter serverextension list
jupyter labextension list
```

- **Issue**: the Git panel does not recognize that you are in a Git repository.

  Possible fixes:

  - Be sure to be in a Git repository in the filebrowser tab

  - Check the server log. If you see a warning with a 404 code similar to:  
    `[W 00:27:41.800 LabApp] 404 GET /git/server_root?1576081660665`

    Explicitly enable the server extension by running:

    ```bash
    jupyter serverextension enable --py jupyterlab_git
    ```

  - If you are using JupyterHub or some other technologies requiring an initialization script which includes the jupyterlab-git extension, be sure to install both the frontend and the server extension **before** launching JupyterLab.

- **Issue**: the Git panel is not visible.

  Possible fixes:

  - Check that the JupyterLab extension is installed:

    ```bash
    jupyter labextension list
    ```

    If you don't see `@jupyterlab/git v... enabled OK` in the list, explicitly install the jupyter labextension by running:

    ```bash
    jupyter labextension install @jupyterlab/git
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
- Saul Shanabrook, Quansight (software engineering)
- Jaipreet Singh, AWS (software engineering, UI/UX design, management)
- Frederic Collonval, Safran Group (software engineering)

A lot of awesome people have contributed to this repo - See the contributors tab for more details!

This list is provided to help provide context about who we are and how our team functions.

If you would like to be listed, please submit a pull request with your information.

### Install

Requires node 4+ and npm 4+

```bash
# Install new-ish JupyterLab
pip install -U jupyterlab

# Clone the repo to your local environment
git clone https://github.com/jupyterlab/jupyterlab-git.git
cd jupyterlab-git

# Install the server extension in development mode and enable it
pip install -e .[test]
jupyter serverextension enable --py jupyterlab_git

# Build the labextension and dev-mode link it to jlab
jlpm build
jupyter labextension link .
```

To rebuild the package after a change and the JupyterLab app:

```bash
jlpm run build
jupyter lab build
```

To continuously monitor the project for changes and automatically trigger a rebuild, start Jupyter in watch mode:

```bash
jupyter lab --watch
```

And in a separate session, begin watching the source directory for changes:

```bash
jlpm run watch
```

Now every change will be built locally and bundled into JupyterLab. Be sure to refresh your browser page after saving file changes to reload the extension (note: you'll need to wait for webpack to finish, which can take 10s+ at times).

To execute the tests

```bash
pytest jupyterlab_git
jlpm run test
```

Whenever you release a new version of this extension please update the history section below as needed.

## History

*Up to date as of February 2020*

The JupyterLab Git extension was created by [Ji Zhang](https://github.com/zzhangjii), [Hana Zarea](https://github.com/hzarea), [Noah Stapp](https://github.com/NoahStapp), and [Ashutosh Bondre](https://github.com/ashutoshbondre) as a part of the [Jupyter Cal Poly](https://github.com/jupytercalpoly) summer internship program. [Jaipreet Singh](https://github.com/jaipreet-s) and [Neelam Gehlot](https://github.com/neelamgehlot) then pushed forward on adding a number of features as part of AWS's investment in the extension, with help from [Saul Shanabrook](https://github.com/saulshanabrook) at Quansight (funded by AWS as well). Both [Konstantin Taletskiy](https://github.com/ktaletsk) at LabShare and [Frédéric Collonval](https://github.com/fcollonval) have been contributing since then, as well as [Max Klein](https://github.com/telamonian) and [Athan](https://github.com/kgryte) at Quansight, paid for by xxx.

Many others have contributed as well, in [code contributions](https://github.com/jupyterlab/jupyterlab-git/graphs/contributors), funding, design, and guidance. Of course this project also exists only because of the monumental efforts at all levels of open source, in particular to the JupyterLab and Jupyter ecosystems, which this directly builds on.
