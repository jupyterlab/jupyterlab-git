"""
Setup Module to setup Python Handlers (Git Handlers) for the Git Plugin.
"""
from os.path import join as pjoin

from setupbase import (
    create_cmdclass, ensure_python, get_version,
    HERE
)

import setuptools

# The name of the project
name='jupyterlab_git'

# Ensure a valid python version
ensure_python('>=3.5')

# Get our version
version = get_version(pjoin(name, '_version.py'))

lab_path = pjoin(HERE, name, 'labextension')

data_files_spec = [
    ('share/jupyter/lab/extensions', lab_path, '*.tgz'),
    ('etc/jupyter/jupyter_notebook_config.d',
     'jupyter-config/jupyter_notebook_config.d', 'jupyterlab_git.json'),
]

cmdclass = create_cmdclass(data_files_spec=data_files_spec)

with open("README.md", "r") as fh:
    long_description = fh.read()

setup_args = dict(
    name            = name,
    description     = "A server extension for JupyterLab's git extension",
    long_description= long_description,
    long_description_content_type="text/markdown",
    version         = version,
    cmdclass        = cmdclass,
    packages        = setuptools.find_packages(),
    author          = 'Jupyter Development Team',
    url             = 'https://github.com/jupyterlab/jupyterlab-git',
    license         = 'BSD',
    platforms       = "Linux, Mac OS X, Windows",
    keywords        = ['Jupyter', 'JupyterLab', 'Git'],
    classifiers     = [
        'Intended Audience :: Developers',
        'Intended Audience :: Science/Research',
        'License :: OSI Approved :: BSD License',
        'Programming Language :: Python',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
        'Framework :: Jupyter',
    ],
    # include_package_data = True,
    install_requires = [
        'notebook',
        'nbdime >= 1.1.0',
        'pexpect'
    ],
    extras_require = {
        'test': [
            'pytest',
            'jupyterlab~=1.1',
        ],
    },
)

setuptools.setup(**setup_args)
