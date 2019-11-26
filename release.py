#!/usr/bin/env python

import json
import subprocess

from setupbase import get_version

def buildBundle():
    subprocess.run(['jlpm', 'clean:slate'])
    subprocess.run(['jlpm', 'build:labextension'])

def tag(version, kind=None):
    """git tagging
    """
    kw = {'version': version, 'kind': kind}
    tag = "{kind}_v{version}".format(**kw) if kind else "v{version}".format(**kw)

    subprocess.run(['git', 'tag', tag])
    subprocess.run(['git', 'push', 'origin', tag])

def pypi(bdist=True, test=False):
    """release on pypi
    """
    if bdist:
        # build the source (sdist) and binary wheel (bdist) releases
        subprocess.run(['python', 'setup.py', 'sdist', 'bdist_wheel'])
    else:
        # build just the source release
        subprocess.run(['python', 'setup.py', 'sdist'])

    if test:
        # release to the test server
        subprocess.run(['twine', 'upload', '--repository-url', 'https://test.pypi.org/legacy/', 'dist/*'])
    else:
        # release to the production server
        subprocess.run(['twine', 'upload', 'dist/*'])

def npmjs(dryRun=False):
    """release on npmjs
    """
    if dryRun:
        # dry run build and release
        subprocess.run(['npm', 'publish', '--access', 'public', '--dry-run'])
    else:
        # build and release
        subprocess.run(['npm', 'publish', '--access', 'public'])

def labExtensionVersion(version=None):
    if version:
        # force the labextension version to match the supplied version
        subprocess.run(['npm', '--no-git-tag-version', 'version', version, '--force', '--allow-same-version'])
    else:
        # get single source of truth from the Typescript labextension
        with open('package.json') as f:
            info = json.load(f)

        version = info['version']

    return version

def serverExtensionVersion():
    # get single source of truth from the Python serverextension
    return get_version('jupyterlab_hdf/_version.py')

def doRelease():
    # do a clean build of the bundle
    buildBundle()

    # treat the serverextension version as the "real" single source of truth
    version = serverExtensionVersion()
    # force the labextension version to agree with the serverextension version
    labExtensionVersion(version=version)

    # tag with version and push the tag
    tag(version=version)

    # release to pypi and npmjs
    pypi()
    npmjs()

if __name__=="__main__":
    doRelease()
