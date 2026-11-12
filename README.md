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

All commands require Node.js 18 or newer.

| Command | What it does |
| --- | --- |
| `driftcheck [path]` | Scan a repository. This is the default command. |
| `driftcheck check [path]` | Scan a repository explicitly. |
| `driftcheck env [path]` | Run environment-variable checks only. |
| `driftcheck docs [path]` | Run Markdown documentation checks only. |
| `driftcheck fix [path]` | Run a full scan. Reserved for automatic fixes in a future release; it does not modify files in v0.1.0. |
| `driftcheck baseline [path]` | Run a full scan. Reserved for baseline management in a future release; it does not write a baseline in v0.1.0. |
| `driftcheck init` | Create `driftcheck.config.json` in the current directory. It refuses to overwrite an existing file. |
| `driftcheck rules` | List rule IDs and their default severities. |
| `driftcheck explain <rule-id>` | Print the documentation location for a known rule. |

### Options

| Option | Description |
| --- | --- |
| `-h`, `--help` | Show the command summary. |
| `-v`, `--version` | Print the installed package version. |
| `--format tree\|compact\|json\|github\|sarif` | Select the report format. Default: `tree`. |
| `--fail-on error\|warn\|info\|never` | Choose which severity produces a non-zero exit code. |
| `--max-issues <number>` | Limit the number of findings printed. `0` prints no findings but still calculates the exit code. |
| `--quiet` / `--verbose` | Accepted output-mode flags. They cannot be used together. |

For example:

```sh
driftcheck . --format compact
driftcheck env . --fail-on warn
driftcheck docs . --format sarif > driftcheck.sarif
driftcheck explain env-undocumented
```

## Output

Use `--format compact` for one finding per line. JSON is suitable for tooling, `github` emits GitHub Actions annotations, and `sarif` is suitable for code-scanning upload.

## Limits

Dynamic environment access cannot be resolved. Python support is pattern based. A locally shadowed `process` is not detected.

## Contributing

Run `npm run style`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before opening a change.
