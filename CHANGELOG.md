# Changelog

<!-- <START NEW CHANGELOG ENTRY> -->

## 0.50.0

([Full Changelog](https://github.com/jupyterlab/jupyterlab-git/compare/v0.9.0...f5efbc41b31f253f23fcb05adca8e4b54b33e327))

### Enhancements made

- Load gitignore file (#1273) [#1298](https://github.com/jupyterlab/jupyterlab-git/pull/1298) ([@fcollonval](https://github.com/fcollonval))
- Fix stash REST API [#1280](https://github.com/jupyterlab/jupyterlab-git/pull/1280) ([@fcollonval](https://github.com/fcollonval))
- Push tags [#1279](https://github.com/jupyterlab/jupyterlab-git/pull/1279) ([@fcollonval](https://github.com/fcollonval))
- Add context menu on commits in the HistorySidebar with add tag command [#1277](https://github.com/jupyterlab/jupyterlab-git/pull/1277) ([@DenisaCG](https://github.com/DenisaCG))
- Show tags in history sidebar [#1272](https://github.com/jupyterlab/jupyterlab-git/pull/1272) ([@DenisaCG](https://github.com/DenisaCG))
- Add new tag feature [#1264](https://github.com/jupyterlab/jupyterlab-git/pull/1264) ([@DenisaCG](https://github.com/DenisaCG))
- Add support for rebase [#1260](https://github.com/jupyterlab/jupyterlab-git/pull/1260) ([@fcollonval](https://github.com/fcollonval))
- Add option to ask user identity on every commit [#1251](https://github.com/jupyterlab/jupyterlab-git/pull/1251) ([@eyusupov](https://github.com/eyusupov))
- Add git_command_timeout_s for allowing >20 seconds for git operations [#1250](https://github.com/jupyterlab/jupyterlab-git/pull/1250) ([@mdietz94](https://github.com/mdietz94))
- Add git to command palette [#1243](https://github.com/jupyterlab/jupyterlab-git/pull/1243) ([@tsabbir96](https://github.com/tsabbir96))

### Bugs fixed

- Fix testing `pathRepository` for `null` [#1304](https://github.com/jupyterlab/jupyterlab-git/pull/1304) ([@fcollonval](https://github.com/fcollonval))
- Don't display details button if message is empty [#1299](https://github.com/jupyterlab/jupyterlab-git/pull/1299) ([@fcollonval](https://github.com/fcollonval))
- Fix styling [#1289](https://github.com/jupyterlab/jupyterlab-git/pull/1289) ([@fcollonval](https://github.com/fcollonval))
- Remove drive from path. [#1285](https://github.com/jupyterlab/jupyterlab-git/pull/1285) ([@fcollonval](https://github.com/fcollonval))
- Fix commit message [#1283](https://github.com/jupyterlab/jupyterlab-git/pull/1283) ([@fcollonval](https://github.com/fcollonval))

### Maintenance and upkeep improvements

- Update nbdime to final release [#1302](https://github.com/jupyterlab/jupyterlab-git/pull/1302) ([@fcollonval](https://github.com/fcollonval))
- Lint README [#1300](https://github.com/jupyterlab/jupyterlab-git/pull/1300) ([@fcollonval](https://github.com/fcollonval))
- Bump nbdime to rc0 [#1290](https://github.com/jupyterlab/jupyterlab-git/pull/1290) ([@fcollonval](https://github.com/fcollonval))
- Bump @babel/traverse from 7.22.10 to 7.23.2 [#1276](https://github.com/jupyterlab/jupyterlab-git/pull/1276) ([@dependabot](https://github.com/dependabot))
- Bump postcss from 8.4.6 to 8.4.31 in /ui-tests [#1275](https://github.com/jupyterlab/jupyterlab-git/pull/1275) ([@dependabot](https://github.com/dependabot))
- Bump postcss from 8.4.27 to 8.4.31 [#1274](https://github.com/jupyterlab/jupyterlab-git/pull/1274) ([@dependabot](https://github.com/dependabot))
- Bump systeminformation from 5.18.12 to 5.21.8 [#1268](https://github.com/jupyterlab/jupyterlab-git/pull/1268) ([@dependabot](https://github.com/dependabot))
- Bump systeminformation from 5.11.2 to 5.21.8 in /ui-tests [#1267](https://github.com/jupyterlab/jupyterlab-git/pull/1267) ([@dependabot](https://github.com/dependabot))
- Switch back to using the Jupyter Releaser actions [#1259](https://github.com/jupyterlab/jupyterlab-git/pull/1259) ([@jtpio](https://github.com/jtpio))
- Rename master to main [#1257](https://github.com/jupyterlab/jupyterlab-git/pull/1257) ([@fcollonval](https://github.com/fcollonval))
- Bump stylelint from 14.16.1 to 15.10.1 [#1253](https://github.com/jupyterlab/jupyterlab-git/pull/1253) ([@dependabot](https://github.com/dependabot))
- Upgrade to jupyterlab 4 [#1236](https://github.com/jupyterlab/jupyterlab-git/pull/1236) ([@HaudinFlorence](https://github.com/HaudinFlorence))

### Documentation improvements

- add kentarolim10 as a contributor for code [#1297](https://github.com/jupyterlab/jupyterlab-git/pull/1297) ([@allcontributors](https://github.com/all-contributors))
- Add constrain in install instructions [#1271](https://github.com/jupyterlab/jupyterlab-git/pull/1271) ([@fcollonval](https://github.com/fcollonval))
- Hotfix/dependency update [#1249](https://github.com/jupyterlab/jupyterlab-git/pull/1249) ([@mfakaehler](https://github.com/mfakaehler))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyterlab/jupyterlab-git/graphs/contributors?from=2019-12-04&to=2023-11-21&type=c))

[@ajbozarth](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Aajbozarth+updated%3A2019-12-04..2023-11-21&type=Issues) | [@allcontributors](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Aallcontributors+updated%3A2019-12-04..2023-11-21&type=Issues) | [@benz0li](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Abenz0li+updated%3A2019-12-04..2023-11-21&type=Issues) | [@blink1073](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Ablink1073+updated%3A2019-12-04..2023-11-21&type=Issues) | [@bryant-finney](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Abryant-finney+updated%3A2019-12-04..2023-11-21&type=Issues) | [@btel](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Abtel+updated%3A2019-12-04..2023-11-21&type=Issues) | [@charliwar](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Acharliwar+updated%3A2019-12-04..2023-11-21&type=Issues) | [@chrisjohn2306](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Achrisjohn2306+updated%3A2019-12-04..2023-11-21&type=Issues) | [@DenisaCG](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3ADenisaCG+updated%3A2019-12-04..2023-11-21&type=Issues) | [@dependabot](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Adependabot+updated%3A2019-12-04..2023-11-21&type=Issues) | [@Dombo](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3ADombo+updated%3A2019-12-04..2023-11-21&type=Issues) | [@echarles](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Aecharles+updated%3A2019-12-04..2023-11-21&type=Issues) | [@eyusupov](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Aeyusupov+updated%3A2019-12-04..2023-11-21&type=Issues) | [@fcollonval](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Afcollonval+updated%3A2019-12-04..2023-11-21&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Agithub-actions+updated%3A2019-12-04..2023-11-21&type=Issues) | [@goanpeca](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Agoanpeca+updated%3A2019-12-04..2023-11-21&type=Issues) | [@HaudinFlorence](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3AHaudinFlorence+updated%3A2019-12-04..2023-11-21&type=Issues) | [@ianhi](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Aianhi+updated%3A2019-12-04..2023-11-21&type=Issues) | [@jaipreet-s](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Ajaipreet-s+updated%3A2019-12-04..2023-11-21&type=Issues) | [@jasongrout](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Ajasongrout+updated%3A2019-12-04..2023-11-21&type=Issues) | [@JasonWeill](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3AJasonWeill+updated%3A2019-12-04..2023-11-21&type=Issues) | [@jtpio](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Ajtpio+updated%3A2019-12-04..2023-11-21&type=Issues) | [@kgryte](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Akgryte+updated%3A2019-12-04..2023-11-21&type=Issues) | [@krassowski](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Akrassowski+updated%3A2019-12-04..2023-11-21&type=Issues) | [@lresende](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Alresende+updated%3A2019-12-04..2023-11-21&type=Issues) | [@lumberbot-app](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Alumberbot-app+updated%3A2019-12-04..2023-11-21&type=Issues) | [@mdietz94](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Amdietz94+updated%3A2019-12-04..2023-11-21&type=Issues) | [@meeseeksmachine](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Ameeseeksmachine+updated%3A2019-12-04..2023-11-21&type=Issues) | [@mfakaehler](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Amfakaehler+updated%3A2019-12-04..2023-11-21&type=Issues) | [@mlucool](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Amlucool+updated%3A2019-12-04..2023-11-21&type=Issues) | [@navn-r](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Anavn-r+updated%3A2019-12-04..2023-11-21&type=Issues) | [@saulshanabrook](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Asaulshanabrook+updated%3A2019-12-04..2023-11-21&type=Issues) | [@shawnesquivel](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Ashawnesquivel+updated%3A2019-12-04..2023-11-21&type=Issues) | [@telamonian](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Atelamonian+updated%3A2019-12-04..2023-11-21&type=Issues) | [@tsabbir96](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Atsabbir96+updated%3A2019-12-04..2023-11-21&type=Issues) | [@welcome](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Awelcome+updated%3A2019-12-04..2023-11-21&type=Issues)

<!-- <END NEW CHANGELOG ENTRY> -->

## 0.50.0rc0

([Full Changelog](https://github.com/jupyterlab/jupyterlab-git/compare/v0.50.0a2...d539f3b510ba2b596daad68814112ff7786abf91))

### Bugs fixed

- Fix styling [#1289](https://github.com/jupyterlab/jupyterlab-git/pull/1289) ([@fcollonval](https://github.com/fcollonval))

### Maintenance and upkeep improvements

- Bump nbdime to rc0 [#1290](https://github.com/jupyterlab/jupyterlab-git/pull/1290) ([@fcollonval](https://github.com/fcollonval))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyterlab/jupyterlab-git/graphs/contributors?from=2023-10-30&to=2023-11-06&type=c))

[@fcollonval](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Afcollonval+updated%3A2023-10-30..2023-11-06&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Agithub-actions+updated%3A2023-10-30..2023-11-06&type=Issues)

## 0.50.0a2

([Full Changelog](https://github.com/jupyterlab/jupyterlab-git/compare/v0.50.0a1...81c258fc958f5b1c08a457e7b51a999e5f2e25b2))

### Bugs fixed

- Remove drive from path. [#1285](https://github.com/jupyterlab/jupyterlab-git/pull/1285) ([@fcollonval](https://github.com/fcollonval))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyterlab/jupyterlab-git/graphs/contributors?from=2023-10-26&to=2023-10-30&type=c))

[@fcollonval](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Afcollonval+updated%3A2023-10-26..2023-10-30&type=Issues)

## 0.50.0a1

([Full Changelog](https://github.com/jupyterlab/jupyterlab-git/compare/v0.50.0a0...a901350985c00bd532fc78c56a8ab5f8b13cef0c))

### Enhancements made

- Fix stash REST API [#1280](https://github.com/jupyterlab/jupyterlab-git/pull/1280) ([@fcollonval](https://github.com/fcollonval))

### Bugs fixed

- Fix commit message [#1283](https://github.com/jupyterlab/jupyterlab-git/pull/1283) ([@fcollonval](https://github.com/fcollonval))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyterlab/jupyterlab-git/graphs/contributors?from=2023-10-24&to=2023-10-26&type=c))

[@fcollonval](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Afcollonval+updated%3A2023-10-24..2023-10-26&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Agithub-actions+updated%3A2023-10-24..2023-10-26&type=Issues)

## 0.50.0a0

([Full Changelog](https://github.com/jupyterlab/jupyterlab-git/compare/v0.44.0...e77defa1129336d028929559176d3091204abd95))

### Maintenance and upkeep improvements

- Upgrade to jupyterlab 4 [#1236](https://github.com/jupyterlab/jupyterlab-git/pull/1236) ([@HaudinFlorence](https://github.com/HaudinFlorence))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyterlab/jupyterlab-git/graphs/contributors?from=2023-10-24&to=2023-10-24&type=c))

[@benz0li](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Abenz0li+updated%3A2023-10-24..2023-10-24&type=Issues) | [@fcollonval](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Afcollonval+updated%3A2023-10-24..2023-10-24&type=Issues) | [@HaudinFlorence](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3AHaudinFlorence+updated%3A2023-10-24..2023-10-24&type=Issues) | [@JasonWeill](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3AJasonWeill+updated%3A2023-10-24..2023-10-24&type=Issues) | [@krassowski](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Akrassowski+updated%3A2023-10-24..2023-10-24&type=Issues) | [@welcome](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Awelcome+updated%3A2023-10-24..2023-10-24&type=Issues)

## 0.44.0

([Full Changelog](https://github.com/jupyterlab/jupyterlab-git/compare/v0.43.0...bb1da19878be3e92c7652d999c90eb93fbd8df87))

### Enhancements made

- Push tags [#1279](https://github.com/jupyterlab/jupyterlab-git/pull/1279) ([@fcollonval](https://github.com/fcollonval))
- Add context menu on commits in the HistorySidebar with add tag command [#1277](https://github.com/jupyterlab/jupyterlab-git/pull/1277) ([@DenisaCG](https://github.com/DenisaCG))
- Show tags in history sidebar [#1272](https://github.com/jupyterlab/jupyterlab-git/pull/1272) ([@DenisaCG](https://github.com/DenisaCG))

### Maintenance and upkeep improvements

- Bump @babel/traverse from 7.22.10 to 7.23.2 [#1276](https://github.com/jupyterlab/jupyterlab-git/pull/1276) ([@dependabot](https://github.com/dependabot))
- Bump postcss from 8.4.6 to 8.4.31 in /ui-tests [#1275](https://github.com/jupyterlab/jupyterlab-git/pull/1275) ([@dependabot](https://github.com/dependabot))
- Bump postcss from 8.4.27 to 8.4.31 [#1274](https://github.com/jupyterlab/jupyterlab-git/pull/1274) ([@dependabot](https://github.com/dependabot))

### Documentation improvements

- Add constrain in install instructions [#1271](https://github.com/jupyterlab/jupyterlab-git/pull/1271) ([@fcollonval](https://github.com/fcollonval))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyterlab/jupyterlab-git/graphs/contributors?from=2023-09-25&to=2023-10-24&type=c))

[@DenisaCG](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3ADenisaCG+updated%3A2023-09-25..2023-10-24&type=Issues) | [@dependabot](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Adependabot+updated%3A2023-09-25..2023-10-24&type=Issues) | [@fcollonval](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Afcollonval+updated%3A2023-09-25..2023-10-24&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Agithub-actions+updated%3A2023-09-25..2023-10-24&type=Issues) | [@welcome](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Awelcome+updated%3A2023-09-25..2023-10-24&type=Issues)

## 0.43.0

([Full Changelog](https://github.com/jupyterlab/jupyterlab-git/compare/v0.42.0...07ee168441fe5b5b8094989ac9168c91ef1dd974))

### Enhancements made

- Add new tag feature [#1264](https://github.com/jupyterlab/jupyterlab-git/pull/1264) ([@DenisaCG](https://github.com/DenisaCG))

### Other merged PRs

- Bump systeminformation from 5.18.12 to 5.21.8 [#1268](https://github.com/jupyterlab/jupyterlab-git/pull/1268) ([@dependabot](https://github.com/dependabot))
- Bump systeminformation from 5.11.2 to 5.21.8 in /ui-tests [#1267](https://github.com/jupyterlab/jupyterlab-git/pull/1267) ([@dependabot](https://github.com/dependabot))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyterlab/jupyterlab-git/graphs/contributors?from=2023-08-10&to=2023-09-25&type=c))

[@DenisaCG](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3ADenisaCG+updated%3A2023-08-10..2023-09-25&type=Issues) | [@dependabot](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Adependabot+updated%3A2023-08-10..2023-09-25&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Agithub-actions+updated%3A2023-08-10..2023-09-25&type=Issues) | [@welcome](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Awelcome+updated%3A2023-08-10..2023-09-25&type=Issues)

## 0.42.0

([Full Changelog](https://github.com/jupyterlab/jupyterlab-git/compare/v0.42.0rc0...6eab13686a92b04f531118a8d76f4ce94437947d))

### Enhancements made

- Add support for rebase [#1260](https://github.com/jupyterlab/jupyterlab-git/pull/1260) ([@fcollonval](https://github.com/fcollonval))
- Add option to ask user identity on every commit [#1251](https://github.com/jupyterlab/jupyterlab-git/pull/1251) ([@eyusupov](https://github.com/eyusupov))
- Add git_command_timeout_s for allowing >20 seconds for git operations [#1250](https://github.com/jupyterlab/jupyterlab-git/pull/1250) ([@mdietz94](https://github.com/mdietz94))
- Add git to command palette [#1243](https://github.com/jupyterlab/jupyterlab-git/pull/1243) ([@tsabbir96](https://github.com/tsabbir96))

### Maintenance and upkeep improvements

- Switch back to using the Jupyter Releaser actions [#1259](https://github.com/jupyterlab/jupyterlab-git/pull/1259) ([@jtpio](https://github.com/jtpio))
- Rename master to main [#1257](https://github.com/jupyterlab/jupyterlab-git/pull/1257) ([@fcollonval](https://github.com/fcollonval))
- Bump stylelint from 14.16.1 to 15.10.1 [#1253](https://github.com/jupyterlab/jupyterlab-git/pull/1253) ([@dependabot](https://github.com/dependabot))

### Documentation improvements

- Hotfix/dependency update [#1249](https://github.com/jupyterlab/jupyterlab-git/pull/1249) ([@mfakaehler](https://github.com/mfakaehler))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyterlab/jupyterlab-git/graphs/contributors?from=2023-06-19&to=2023-08-10&type=c))

[@dependabot](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Adependabot+updated%3A2023-06-19..2023-08-10&type=Issues) | [@eyusupov](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Aeyusupov+updated%3A2023-06-19..2023-08-10&type=Issues) | [@fcollonval](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Afcollonval+updated%3A2023-06-19..2023-08-10&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Agithub-actions+updated%3A2023-06-19..2023-08-10&type=Issues) | [@jtpio](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Ajtpio+updated%3A2023-06-19..2023-08-10&type=Issues) | [@mdietz94](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Amdietz94+updated%3A2023-06-19..2023-08-10&type=Issues) | [@mfakaehler](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Amfakaehler+updated%3A2023-06-19..2023-08-10&type=Issues) | [@tsabbir96](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Atsabbir96+updated%3A2023-06-19..2023-08-10&type=Issues) | [@welcome](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Awelcome+updated%3A2023-06-19..2023-08-10&type=Issues)

## 0.42.0rc0

([Full Changelog](https://github.com/jupyterlab/jupyterlab-git/compare/v0.41.0...d14ba4ab42371a139dadceb56c2458819bee6c53))

### Enhancements made

- Add git stash [#1228](https://github.com/jupyterlab/jupyterlab-git/pull/1228) ([@shawnesquivel](https://github.com/shawnesquivel))
- Fix files changed and reverting merge commits from the history panel bug [#1227](https://github.com/jupyterlab/jupyterlab-git/pull/1227) ([@basokant](https://github.com/basokant))
- Adding support for standalone diffs of images [#1223](https://github.com/jupyterlab/jupyterlab-git/pull/1223) ([@basokant](https://github.com/basokant))

### Bugs fixed

- Fix menu entry selection [#1246](https://github.com/jupyterlab/jupyterlab-git/pull/1246) ([@fcollonval](https://github.com/fcollonval))
- fix switch from a detached head to a branch not working [#1218](https://github.com/jupyterlab/jupyterlab-git/pull/1218) ([@basokant](https://github.com/basokant))
- fix history panel not rendering when history is empty [#1215](https://github.com/jupyterlab/jupyterlab-git/pull/1215) ([@basokant](https://github.com/basokant))

### Maintenance and upkeep improvements

- Update configuration on latest 3.x template [#1248](https://github.com/jupyterlab/jupyterlab-git/pull/1248) ([@fcollonval](https://github.com/fcollonval))
- Bump vega from 5.21.0 to 5.23.0 in /ui-tests [#1229](https://github.com/jupyterlab/jupyterlab-git/pull/1229) ([@dependabot](https://github.com/dependabot))
- Update pre-commit [#1216](https://github.com/jupyterlab/jupyterlab-git/pull/1216) ([@fcollonval](https://github.com/fcollonval))
- Bump to 0.41.0 [#1204](https://github.com/jupyterlab/jupyterlab-git/pull/1204) ([@fcollonval](https://github.com/fcollonval))

### Other merged PRs

- Bump json5 from 2.2.0 to 2.2.3 in /ui-tests [#1235](https://github.com/jupyterlab/jupyterlab-git/pull/1235) ([@dependabot](https://github.com/dependabot))
- Bump webpack from 5.74.0 to 5.76.1 [#1232](https://github.com/jupyterlab/jupyterlab-git/pull/1232) ([@dependabot](https://github.com/dependabot))
- add shawnesquivel as a contributor for code [#1225](https://github.com/jupyterlab/jupyterlab-git/pull/1225) ([@allcontributors](https://github.com/all-contributors))
- add basokant as a contributor for code [#1224](https://github.com/jupyterlab/jupyterlab-git/pull/1224) ([@allcontributors](https://github.com/all-contributors))
- bug: modified password placeholder text depending if remote URI is github (Fix #1176) [#1220](https://github.com/jupyterlab/jupyterlab-git/pull/1220) ([@shawnesquivel](https://github.com/shawnesquivel))
- Bump http-cache-semantics from 4.1.0 to 4.1.1 [#1213](https://github.com/jupyterlab/jupyterlab-git/pull/1213) ([@dependabot](https://github.com/dependabot))
- Hide overflow for latest item on click [#1212](https://github.com/jupyterlab/jupyterlab-git/pull/1212) ([@ardislu](https://github.com/ardislu))
- Bump json5 from 1.0.1 to 1.0.2 [#1208](https://github.com/jupyterlab/jupyterlab-git/pull/1208) ([@dependabot](https://github.com/dependabot))

### Contributors to this release

([GitHub contributors page for this release](https://github.com/jupyterlab/jupyterlab-git/graphs/contributors?from=2022-12-15&to=2023-06-19&type=c))

[@allcontributors](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Aallcontributors+updated%3A2022-12-15..2023-06-19&type=Issues) | [@ardislu](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Aardislu+updated%3A2022-12-15..2023-06-19&type=Issues) | [@basokant](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Abasokant+updated%3A2022-12-15..2023-06-19&type=Issues) | [@dependabot](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Adependabot+updated%3A2022-12-15..2023-06-19&type=Issues) | [@fcollonval](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Afcollonval+updated%3A2022-12-15..2023-06-19&type=Issues) | [@github-actions](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Agithub-actions+updated%3A2022-12-15..2023-06-19&type=Issues) | [@shawnesquivel](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Ashawnesquivel+updated%3A2022-12-15..2023-06-19&type=Issues) | [@welcome](https://github.com/search?q=repo%3Ajupyterlab%2Fjupyterlab-git+involves%3Awelcome+updated%3A2022-12-15..2023-06-19&type=Issues)
