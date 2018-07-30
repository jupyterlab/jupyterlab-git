"""
Setup Module to setup Python Handlers (Git Handlers) for the Git Plugin.
"""
import setuptools

setuptools.setup(
    name='jupyterlab_git',
    version='0.1.1',
    author='Git Intern Team, Noah Stapp, Jenna Landy, Alena Mueller',
    description="A server extension for JupyterLab's git extension",
    packages=setuptools.find_packages(),
    install_requires=[
        'notebook',
        'psutil'
    ],
    package_data={'jupyterlab_git': ['*']},
)
