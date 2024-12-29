# @wisdesign/cli

## 0.0.22

### Patch Changes

- [#20](https://github.com/wisdesignsystem/wis-cli/pull/20) [`0b89732`](https://github.com/wisdesignsystem/wis-cli/commit/0b897329dfae6ab57afeeb0ce6c1e08163c583cd) Thanks [@FaureWu](https://github.com/FaureWu)! - [feature] Rename download-repo to expose-repo, because of npm not allow download keyword

- Updated dependencies [[`0b89732`](https://github.com/wisdesignsystem/wis-cli/commit/0b897329dfae6ab57afeeb0ce6c1e08163c583cd)]:
  - @wisdesign/expose-repo@0.0.2

## 0.0.21

### Patch Changes

- [#16](https://github.com/wisdesignsystem/wis-cli/pull/16) [`4fa0d11`](https://github.com/wisdesignsystem/wis-cli/commit/4fa0d11c562b6f5cba05526d6c9a1324c507ebed) Thanks [@FaureWu](https://github.com/FaureWu)! - [feature] Change the download github to @wisdesign/download-repo

- [#19](https://github.com/wisdesignsystem/wis-cli/pull/19) [`5793b8b`](https://github.com/wisdesignsystem/wis-cli/commit/5793b8b62fe04065ce683f4f14479155cb4b7197) Thanks [@FaureWu](https://github.com/FaureWu)! - [feature] Add the typescript definition of config

- [#19](https://github.com/wisdesignsystem/wis-cli/pull/19) [`471c88b`](https://github.com/wisdesignsystem/wis-cli/commit/471c88b989c86e2c451656f26553a8cb1f020b7c) Thanks [@FaureWu](https://github.com/FaureWu)! - [feature] Unified management routing by @wiscore/router

- Updated dependencies [[`471c88b`](https://github.com/wisdesignsystem/wis-cli/commit/471c88b989c86e2c451656f26553a8cb1f020b7c), [`4fa0d11`](https://github.com/wisdesignsystem/wis-cli/commit/4fa0d11c562b6f5cba05526d6c9a1324c507ebed), [`471c88b`](https://github.com/wisdesignsystem/wis-cli/commit/471c88b989c86e2c451656f26553a8cb1f020b7c)]:
  - @wisdesign/log-webpack-plugin@0.0.7
  - @wisdesign/download-repo@0.0.1
  - @wisdesign/plugin-router@0.0.10
  - @wiscore/router@0.0.1

## 0.0.19

### Patch Changes

- 5a1f4dd: [feature] translate the tip message to english
- b16e4e8: [feature] change the create command with new wis template
- Updated dependencies [5a1f4dd]
- Updated dependencies [b16e4e8]
  - @wisdesign/log-webpack-plugin@0.0.6
  - @wisdesign/utils@0.0.6
  - @wisdesign/configure@0.0.6
  - @wisdesign/plugin-import-demand@0.0.4
  - @wisdesign/plugin-remote-entry@0.0.5
  - @wisdesign/plugin-router@0.0.9

## 0.0.18

### Patch Changes

- Updated dependencies [9a5f63b]
  - @wisdesign/utils@0.0.5
  - @wisdesign/configure@0.0.5
  - @wisdesign/log-webpack-plugin@0.0.5
  - @wisdesign/plugin-import-demand@0.0.3
  - @wisdesign/plugin-remote-entry@0.0.4
  - @wisdesign/plugin-router@0.0.8

## 0.0.17

### Patch Changes

- 6c00ea9: [feature] change the cli to support typescript for project
- Updated dependencies [6c00ea9]
  - @wisdesign/setup-html-webpack-plugin@0.0.2
  - @wisdesign/plugin-import-demand@0.0.2
  - @wisdesign/log-webpack-plugin@0.0.4
  - @wisdesign/plugin-router@0.0.7
  - @wisdesign/plugin-cross@0.0.7
  - @wisdesign/plugin-less@0.0.2
  - @wisdesign/plugin-sass@0.0.2
  - @wisdesign/configure@0.0.4
  - @wisdesign/utils@0.0.4
  - @wisdesign/plugin-remote-entry@0.0.3

## 0.0.16

### Patch Changes

- 53d41ed: [fix] add the loss less plugin package dependency

## 0.0.15

### Patch Changes

- 87fa865: [feature] add the sass plugin for wis
- Updated dependencies [87fa865]
  - @wisdesign/plugin-sass@0.0.1

## 0.0.14

### Patch Changes

- 7ab8fdf: [fix] Fix the import demand match rule
- Updated dependencies
  - @wisdesign/plugin-router@0.0.6

## 0.0.13

### Patch Changes

- 775d773: [fix] Fix the user plugin cannot get system plugin config bug
- Updated dependencies [775d773]
- Updated dependencies [775d773]
  - @wisdesign/plugin-cross@0.0.6
  - @wisdesign/plugin-router@0.0.5

## 0.0.12

### Patch Changes

- 96af9c6: [feature] Temporarily remove the current partial subpackage configuration and re-think the subpackage mechanism later.
- Updated dependencies [96af9c6]
  - @wisdesign/plugin-remote-entry@0.0.2

## 0.0.11

### Patch Changes

- 39a0421: [chore] move devDependencies to dependencies

## 0.0.10

### Patch Changes

- f532c93: [feature] add config file parse plugin hook
- f532c93: [feature] Modify the resource subpackage scheme of the scaffolding

## 0.0.9

### Patch Changes

- 33ad706: [feature] add webpack clean and replace .wis.prod by .wis

## 0.0.8

### Patch Changes

- 26bad28: [feature] add the remote entry feature
- Updated dependencies [26bad28]
  - @wisdesign/plugin-router@0.0.3
  - @wisdesign/utils@0.0.2
  - @wisdesign/remote-entry-webpack-plugin@0.0.1
  - @wisdesign/configure@0.0.2
  - @wisdesign/log-webpack-plugin@0.0.2
  - @wisdesign/plugin-cross@0.0.4

## 0.0.7

### Patch Changes

- 14ca8e1: [fix] fix the svg component not valid

## 0.0.6

### Patch Changes

- 2cbced3: [feature] support use inline query to use svg component

## 0.0.5

### Patch Changes

- [feature] support controlling the cross-terminal agent through global variables
  - @wisdesign/plugin-cross@0.0.3

## 0.0.4

### Patch Changes

- [fix] cli remote feature problem fix
- Updated dependencies [fce6747]
  - @wisdesign/remote-webpack-plugin@0.0.2
  - @wisdesign/plugin-router@0.0.2
  - @wisdesign/plugin-cross@0.0.2

## 0.0.3

### Patch Changes

- [fix] Limit the restart feature in development mode

## 0.0.2

### Patch Changes

- [fix] Fix the plugin-router version error

## 0.0.1

### Patch Changes

- [feature] CLI cross end basic capabilities
- [feature] CLI basic framework capabilities, including routing, resources, packaging, etc.
- Updated dependencies
  - @wisdesign/plugin-cross@0.0.1
  - @wisdesign/setup-html-webpack-plugin@0.0.1
  - @wisdesign/remote-webpack-plugin@0.0.1
  - @wisdesign/log-webpack-plugin@0.0.1
  - @wisdesign/prettier-config@0.0.1
  - @wisdesign/eslint-config@0.0.1
  - @wisdesign/configure@0.0.1
  - @wisdesign/utils@0.0.1
  - @wisdesign/plugin-less@0.0.1
  - @wisdesign/plugin-typescript@0.0.1
  - @wisdesign/plugin-mock@0.0.1
