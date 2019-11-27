#!/usr/bin/env python

import argparse as argpar
import json
import subprocess

from setupbase import get_version

VERSION_PY = 'jupyterlab_git/_version.py'

def buildLabextensionBundle():
    subprocess.run(['jlpm', 'clean:slate'])
    subprocess.run(['jlpm', 'build:labextension'])

def tag(version, dryrun=False, kind=None):
    """git tagging
    """
    kw = {'version': version, 'kind': kind}
    tag = '{kind}_v{version}'.format(**kw) if kind else 'v{version}'.format(**kw)

    if dryrun:
        print("Would tag: {}".format(tag))
    else:
        subprocess.run(['git', 'tag', tag])
        subprocess.run(['git', 'push', 'origin', tag])

def pypi(wheel=True, test=False):
    """release on pypi
    """
    if wheel:
        # build the source (sdist) and binary wheel (bdist_wheel) releases
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

def npmjs(dryrun=False):
    """release on npmjs
    """
    if dryrun:
        # dry run build and release
        subprocess.run(['npm', 'publish', '--access', 'public', '--dry-run'])
    else:
        # build and release
        subprocess.run(['npm', 'publish', '--access', 'public'])

def labExtensionVersion(dryrun=False, version=None):
    if version:
        force_ver_cmd = ['npm', '--no-git-tag-version', 'version', version, '--force', '--allow-same-version']
        if dryrun:
            print("Would force npm version with: {}".format(' '.join(force_ver_cmd)))
        else:
            # force the labextension version to match the supplied version
            subprocess.run(force_ver_cmd)
    else:
        # get single source of truth from the Typescript labextension
        with open('package.json') as f:
            info = json.load(f)

        version = info['version']

    return version

def serverExtensionVersion():
    # get single source of truth from the Python serverextension
    return get_version(VERSION_PY)

def doRelease(test=False):
    # do a clean build of the bundle
    buildLabextensionBundle()

    # treat the serverextension version as the "real" single source of truth
    version = serverExtensionVersion()
    # force the labextension version to agree with the serverextension version
    labExtensionVersion(dryrun=test, version=version)

    # tag with version and push the tag
    tag(dryrun=test, version=version)

    # release to pypi and npmjs
    pypi(test=test)
    npmjs(dryrun=test)

def main():
    parser = argpar.ArgumentParser()

    parser.add_argument('--test', action='store_true',
        help='Release to Pypi test server; performs a dryrun of all other release actions')

    parsed = vars(parser.parse_args())

    doRelease(test=parsed['test'])

if __name__=='__main__':
    main()
