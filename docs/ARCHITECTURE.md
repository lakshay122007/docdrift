# Architecture

```
files -> walker -> extractors -> facts -> rules -> findings -> reporter -> exit code
```

Extractors only collect facts. Rules only compare facts. This separation makes it possible to test parsing and policy separately.

`@babel/parser` reads JavaScript syntax. `yaml` reads Compose and workflow files. `unified` and remark read Markdown. `ignore` applies gitignore patterns.
