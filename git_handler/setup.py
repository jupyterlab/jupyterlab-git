import setuptools

setuptools.setup(
    name='git_handler',
    version='0.1.0',
    packages=setuptools.find_packages(),
    install_requires=[
        'notebook',
    ],
    package_data={'git_handler': ['static/*']},
)
