# Test

The test will produce a video to help debugging in case of failures and check what happened.

1. Compile the extension:

```
jlpm install
jlpm run build:prod
```

2. Start JupyterLab _with the extension installed_ without any token or password

```
jupyter lab --config ./ui-tests/jupyter_server_config.py
```

3. Execute in another console the [Playwright](https://playwright.dev/docs/intro) tests:

```
cd ui-tests
jlpm install
jlpm playwright install
jlpm playwright test
```

# Create tests

To create tests, the easiest way is to use the code generator tool of playwright:

1. Compile the extension:

```
jlpm install
jlpm run build:prod
```

2. Start JupyterLab _with the extension installed_ without any token or password:

```
jupyter lab --config ./ui-tests/jupyter_server_config.py
```

3. Launch the code generator tool:

```
cd ui-tests
jlpm install
jlpm playwright install
jlpm playwright codegen localhost:8888
```

# Debug tests

To debug tests, a good way is to use the inspector tool of playwright:

1. Compile the extension:

```
jlpm install
jlpm run build:prod
```

2. Start JupyterLab _with the extension installed_ without any token or password:

```
jupyter lab --config ./ui-tests/jupyter_server_config.py
```

3. Launch the debug tool:

```
cd ui-tests
jlpm install
jlpm playwright install
PWDEBUG=1 jlpm playwright test
```
