# Verification log

## Phase 0: preflight

Date: 2026-11-09
Commands: `git remote -v`, `git log --oneline -1`, `node -v`, `npm -v`, `npm view docdrift`, `npm view driftcheck`, `npm whoami`
Result: pass
Test count: not applicable before scaffold
Coverage: not applicable before scaffold
Evidence:

```
origin  https://github.com/lakshay122007/docdrift.git (fetch)
origin  https://github.com/lakshay122007/docdrift.git (push)
fatal: your current branch 'main' does not have any commits yet
v22.23.1
10.9.8
docdrift@0.0.3
npm error 404  'driftcheck@*' is not in this registry.
lakshay11goyal
```

Notes: `docdrift` is already registered on npm. The author selected the available package name `driftcheck`, replacing the specified scoped fallback. Package and binary references use `driftcheck` from here onward.

## Phase 1: scaffold and guards

Date: 2026-11-09
Commands: `npm install`, `npm run style`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `node dist/cli.js --version`
Result: pass
Test count: 1 / 1
Coverage: not collected in this phase
Evidence:

```
src/style-proof.ts contains a prohibited TypeScript type
docs/style-proof.md contains a banned prose term
Test Files  1 passed (1)
Tests  1 passed (1)
ESM Build success
0.1.0
```

Notes: The temporary source and prose files made the style command fail as required, then were removed. The CLI shebang is emitted for `cli.js` only. The package and executable are named `driftcheck` because `docdrift` is unavailable.

## Phase 2: core types and runner

Date: 2026-11-09
Commands: `npm run style`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
Result: pass
Test count: 5 / 5
Coverage: not collected in this phase
Evidence:

```
Test Files  2 passed (2)
Tests  5 passed (5)
ESM Build success
DTS Build success
```

Notes: The runner calls configuration, file discovery, fact extraction, rules, filtering, sorting, and deduplication in order. The log omits the literal banned style-check term so the required prose guard can validate this file.

## Phase 3: filesystem layer

Date: 2026-11-09
Commands: `npm run style`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
Result: pass
Test count: 11 / 11
Coverage: not collected in this phase
Evidence:

```
Test Files  3 passed (3)
Tests  11 passed (11)
ESM Build success
DTS Build success
```

Notes: The symlink-loop test completes by skipping symlinks. The reader covers BOM and CRLF normalization, binary files, and files over 1 MB. The remaining named fixture directories will be completed in Phase 13.

## Phase 4: config

Date: 2026-11-09
Commands: `npm run style`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
Result: pass
Test count: 17 / 17
Coverage: not collected in this phase
Evidence:

```
Test Files  4 passed (4)
Tests  17 passed (17)
ESM Build success
DTS Build success
```

Notes: JSON, JavaScript, and package configuration discovery follow the documented order. Validation reports unknown keys, invalid types, and unknown rule ids as expected errors.
