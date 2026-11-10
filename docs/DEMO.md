# Demo

Run these commands from the project root.

```sh
npm run build
node dist/cli.js examples/demo-repo --format compact
```

Say that the demo contains one missing environment declaration, unused declarations, a missing script, and a broken link. Then add `MISSING=` to `.env.example` and rerun to show the environment finding disappear.
