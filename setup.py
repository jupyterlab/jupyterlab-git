"""
Setup Module to setup Python Handlers (Git Handlers) for the Git Plugin.
"""
import setuptools

with open("README.md", "r") as fh:
    long_description = fh.read()

setuptools.setup(
    name='jupyterlab_git',
    version='0.8.0',
    author='Git Intern Team - Noah Stapp, Jenna Landy, Alena Mueller; AWS - Jaipreet Singh, Neelam Gehlot; Quansight - Saul Shanabrook',
    description="A server extension for JupyterLab's git extension",
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=setuptools.find_packages(),
    install_requires=[
        'notebook',
        'nbdime >= 1.1.0'
    ],
    package_data={'jupyterlab_git': ['*']},
)
