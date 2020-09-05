#!/usr/bin/env python
import argparse as argpar
import json
import subprocess
from packaging.version import parse

from setupbase import get_version

VERSION_PY = "jupyterlab_git/_version.py"


def assertEqualVersion():
    serverVersion = parse(serverExtensionVersion())
    frontendVersion = parse(labExtensionVersion())

    error_msg = "Frontend ({}) and server ({}) version do not match".format(
        frontendVersion, serverVersion
    )
    assert serverVersion == frontendVersion, error_msg


def prepLabextensionBundle():
    subprocess.run(["jlpm", "clean:slate"])


def tag(version, dryrun=False, kind=None):
    """git tagging"""
    kw = {"version": version, "kind": kind}
    tag = "{kind}_v{version}".format(**kw) if kind else "v{version}".format(**kw)

    if dryrun:
        print("Would tag: {}".format(tag))
    else:
        subprocess.run(["git", "tag", tag])
        subprocess.run(["git", "push", "upstream", tag])


def pypi(wheel=True, test=False):
    """release on pypi"""
    if wheel:
        # build the source (sdist) and binary wheel (bdist_wheel) releases
        subprocess.run(["python", "setup.py", "sdist", "bdist_wheel"])
    else:
        # build just the source release
        subprocess.run(["python", "setup.py", "sdist"])

    if test:
        # release to the test server
        subprocess.run(
            [
                "twine",
                "upload",
                "--repository-url",
                "https://test.pypi.org/legacy/",
                "dist/*",
            ]
        )
    else:
        # release to the production server
        subprocess.run(["twine", "upload", "dist/*"])


def npmjs(dryrun=False):
    """release on npmjs"""
    if dryrun:
        # dry run build and release
        subprocess.run(["npm", "publish", "--access", "public", "--dry-run"])
    else:
        # build and release
        subprocess.run(["npm", "publish", "--access", "public"])


def labExtensionVersion(dryrun=False, version=None):
    if version:
        if "rc" in version:
            version, rc = version.split("rc")
            version = version + "-rc.{}".format(rc)

        force_ver_cmd = [
            "npm",
            "--no-git-tag-version",
            "version",
            version,
            "--force",
            "--allow-same-version",
        ]
        force_ver_info = " ".join(force_ver_cmd)

        if dryrun:
            print("Would force npm version with: {}".format(force_ver_info))
        else:
            # force the labextension version to match the supplied version
            print("> {}".format(force_ver_info))
            subprocess.run(force_ver_cmd)
    else:
        # get single source of truth from the Typescript labextension
        with open("package.json") as f:
            info = json.load(f)

        version = info["version"]

    return version


def serverExtensionVersion():
    # get single source of truth from the Python serverextension
    return get_version(VERSION_PY)


def doRelease(test=False):
    # treat the serverextension version as the "real" single source of truth
    version = serverExtensionVersion()
    # force the labextension version to agree with the serverextension version
    labExtensionVersion(version=version)

    # tag with version and push the tag
    tag(dryrun=test, version=version)

    # prep the build area for the labextension bundle
    prepLabextensionBundle()

    # release to pypi and npmjs
    pypi(test=test)
    npmjs(dryrun=test)


def main():
    parser = argpar.ArgumentParser()

    parser.add_argument(
        "--test",
        action="store_true",
        help="Release to Pypi test server; performs a dryrun of all other release actions",
    )

    parsed = vars(parser.parse_args())

    doRelease(test=parsed["test"])


if __name__ == "__main__":
    main()
