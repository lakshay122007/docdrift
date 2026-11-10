# driftcheck

driftcheck finds environment and Markdown documentation that no longer matches a repository.

## Install

```sh
npx driftcheck .
```

## Example

```text
README.md:5:1 error docs-link-broken-file target does not exist: missing.md
src/app.js:1:1 error env-undocumented MISSING is read in code but is not declared
```

## Commands

`driftcheck [path]` scans a repository. `driftcheck init` writes a config file. `driftcheck rules` lists rules. `driftcheck explain <rule>` points to its explanation.

## Output

Use `--format compact` for one finding per line. The library also provides JSON, GitHub annotations, and SARIF renderers.

## Limits

Dynamic environment access cannot be resolved. Python support is pattern based. A locally shadowed `process` is not detected.

## Contributing

Run `npm run style`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before opening a change.
