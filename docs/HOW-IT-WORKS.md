# How it works

1. driftcheck finds a project root.
2. It reads candidate files safely.
3. Extractors collect facts such as environment reads and Markdown links.
4. Rules compare facts and make findings.
5. Ignore directives and configuration filter findings.
6. A reporter prints output and the CLI selects an exit code.

For example, `const key = process.env.API_KEY` creates an environment-read fact. If `.env.example` does not declare `API_KEY`, the undocumented-environment rule prints a finding.
