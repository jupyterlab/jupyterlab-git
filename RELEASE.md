# Making a new release of jupyterlab_git

The extension can be published to `PyPI` and `npm` manually or using the [Jupyter Releaser](https://github.com/jupyter-server/jupyter_releaser).

## Manual release

### Python package

This extension can be distributed as Python packages. All of the Python
packaging instructions are in the `pyproject.toml` file to wrap your extension in a
Python package. Before generating a package, you first need to install some tools:

```bash
pip install build twine hatch
```

Bump the version using `hatch`. By default this will create a tag.
See the docs on [hatch-nodejs-version](https://github.com/agoose77/hatch-nodejs-version#semver) for details.

```bash
hatch version <new-version>
```

Make sure to clean up all the development files before building the package:

```bash
jlpm clean:all
```

You could also clean up the local git repository:

```bash
git clean -dfX
```

To create a Python source package (`.tar.gz`) and the binary package (`.whl`) in the `dist/` directory, do:

```bash
python -m build
```

> `python setup.py sdist bdist_wheel` is deprecated and will not work for this package.

Then to upload the package to PyPI, do:

```bash
twine upload dist/*
```

### NPM package

To publish the frontend part of the extension as a NPM package, do:

```bash
npm login
npm publish --access public
```

## Automated releases with the Jupyter Releaser

The extension repository should already be compatible with the Jupyter Releaser.

Check out the [workflow documentation](https://jupyter-releaser.readthedocs.io/en/latest/get_started/making_release_from_repo.html) for more information.

Here is a summary of the steps to cut a new release:

- Add tokens to the [Github Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) in the repository:
  - `ADMIN_GITHUB_TOKEN` (with "public_repo" and "repo:status" permissions); see the [documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
  - `NPM_TOKEN` (with "automation" permission); see the [documentation](https://docs.npmjs.com/creating-and-viewing-access-tokens)
- Set up PyPI

<details><summary>Using PyPI trusted publisher (modern way)</summary>

- Set up your PyPI project by [adding a trusted publisher](https://docs.pypi.org/trusted-publishers/adding-a-publisher/)
  - The _workflow name_ is `publish-release.yml` and the _environment_ should be left blank.
- Ensure the publish release job as `permissions`: `id-token : write` (see the [documentation](https://docs.pypi.org/trusted-publishers/using-a-publisher/))

</details>

- Go to the Actions panel
- Run the "Step 1: Prep Release" workflow
- Check the draft changelog
- Run the "Step 2: Publish Release" workflow

## Publishing to `conda-forge`

If the package is not on conda forge yet, check the documentation to learn how to add it: https://conda-forge.org/docs/maintainer/adding_pkgs.html

Otherwise a bot should pick up the new version publish to PyPI, and open a new PR on the feedstock repository automatically.
