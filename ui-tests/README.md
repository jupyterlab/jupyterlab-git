# Integration Testing

This folder contains the integration tests of the extension.

They are defined using [Playwright](https://playwright.dev/docs/intro) test runner
and [Galata](https://github.com/jupyterlab/jupyterlab/tree/main/galata) helper.

The Playwright configuration is defined in [playwright.config.js](./playwright.config.js).

The JupyterLab server configuration to use for the integration test is defined
in [jupyter_server_test_config.py](./jupyter_server_test_config.py).

The default configuration will produce video for failing tests and an HTML report.

> There is a new experimental UI mode that you may fall in love with; see [that video](https://www.youtube.com/watch?v=jF0yA-JLQW0).

## Run the tests

> All commands are assumed to be executed from the root directory

To run the tests, you need to:

0. Install additional dependency:

```
pip install jupyter-archive
```

1. Compile the extension:

```sh
jlpm install
jlpm build:prod
```

> Check the extension is installed in JupyterLab.

2. Install test dependencies (needed only once):

```sh
cd ./ui-tests
jlpm install
jlpm playwright install
cd ..
```

3. Execute the [Playwright](https://playwright.dev/docs/intro) tests:

```sh
cd ./ui-tests
jlpm playwright test
```

Test results will be shown in the terminal. In case of any test failures, the test report
will be opened in your browser at the end of the tests execution; see
[Playwright documentation](https://playwright.dev/docs/test-reporters#html-reporter)
for configuring that behavior.

## Update the tests snapshots

> All commands are assumed to be executed from the root directory

If you are comparing snapshots to validate your tests, you may need to update
the reference snapshots stored in the repository. To do that, you need to:

0. Install additional dependency:

```
pip install jupyter-archive
```

1. Compile the extension:

```sh
jlpm install
jlpm build:prod
```

> Check the extension is installed in JupyterLab.

2. Install test dependencies (needed only once):

```sh
cd ./ui-tests
jlpm install
jlpm playwright install
cd ..
```

3. Execute the [Playwright](https://playwright.dev/docs/intro) command:

```sh
cd ./ui-tests
jlpm playwright test -u
```

> Some discrepancy may occurs between the snapshots generated on your computer and
> the one generated on the CI. To ease updating the snapshots on a PR, you can
> type `please update playwright snapshots` to trigger the update by a bot on the CI.
> Once the bot has computed new snapshots, it will commit them to the PR branch.

## Create tests

> All commands are assumed to be executed from the root directory

To create tests, the easiest way is to use the code generator tool of playwright:

0. Install additional dependency:

```
pip install jupyter-archive
```

1. Compile the extension:

```sh
jlpm install
jlpm build:prod
```

> Check the extension is installed in JupyterLab.

2. Install test dependencies (needed only once):

```sh
cd ./ui-tests
jlpm install
jlpm playwright install
cd ..
```

3. Start the server:

```sh
cd ./ui-tests
jlpm start
```

4. Execute the [Playwright code generator](https://playwright.dev/docs/codegen) in **another terminal**:

```sh
cd ./ui-tests
jlpm playwright codegen localhost:8888
```

## Debug tests

> All commands are assumed to be executed from the root directory

To debug tests, a good way is to use the inspector tool of playwright:

0. Install additional dependency:

```
pip install jupyter-archive
```

1. Compile the extension:

```sh
jlpm install
jlpm build:prod
```

> Check the extension is installed in JupyterLab.

2. Install test dependencies (needed only once):

```sh
cd ./ui-tests
jlpm install
jlpm playwright install
cd ..
```

3. Execute the Playwright tests in [debug mode](https://playwright.dev/docs/debug):

```sh
cd ./ui-tests
jlpm playwright test --debug
```

## Record the README screencast

The screencast displayed in the [README](../README.md) is recorded with Playwright, following
the scenario defined in [screencast/readme.screencast.ts](./screencast/readme.screencast.ts).
It runs on a demo repository created by [screencast/demo-repository.ts](./screencast/demo-repository.ts).

The video is not stored in this repository. Record a new one when the user interface changes.

### With GitHub Actions

1. Run the _Screencast_ workflow from the _Actions_ tab of the repository, with the _Run workflow_ button.
2. Download the `jupyterlab-git-screencast` artifact from the summary page of the workflow run.

### Locally

> All commands are assumed to be executed from the root directory

The video is encoded with [ffmpeg](https://ffmpeg.org/), which must be available on your `PATH`.

0. Install additional dependency:

```
pip install jupyter-archive
```

1. Compile the extension:

```sh
jlpm install
jlpm build:prod
```

> Check the extension is installed in JupyterLab.

2. Install test dependencies (needed only once):

```sh
cd ./ui-tests
jlpm install
jlpm playwright install chromium
cd ..
```

3. Record the screencast:

```sh
cd ./ui-tests
jlpm screencast
```

The video is saved to `ui-tests/screencast-results/jupyterlab-git.mp4`.

### Update the README

1. Open a pull request, and drag and drop the video in its description: GitHub uploads it
   and inserts a link like `https://github.com/user-attachments/assets/...`.
2. Replace the link to the previous screencast at the top of the [README](../README.md)
   with this one, on its own line: GitHub displays it as a video player.

## Upgrade Playwright and the browsers

To update the web browser versions, you must update the package `@playwright/test`:

```sh
cd ./ui-tests
jlpm up "@playwright/test"
jlpm playwright install
```
