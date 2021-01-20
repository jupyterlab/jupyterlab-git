__all__ = ["__version__"]


def _fetchVersion():
    import json
    import pathlib
    from packaging.version import parse

    HERE = pathlib.Path(__file__).parent

    for d in HERE.rglob("package.json"):
        try:
            with d.open() as f:
                return str(parse(json.load(f)["version"]))
        except FileNotFoundError:
            pass

    raise FileNotFoundError("Could not find package.json under dir {}".format(HERE))


__version__ = _fetchVersion()
