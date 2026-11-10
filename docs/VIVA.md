# Viva questions

1. Why use an AST? It separates code from comments and strings. That avoids many regex mistakes.
2. Why separate facts and rules? Parsing and policy can be tested independently.
3. How are slugs made? The tool lowercases text, removes punctuation, and joins spaces with hyphens.
4. Why do exit codes matter? CI can fail only when the selected severity occurs.
5. What is a baseline? It stores known findings by a stable hash.
6. How are symlink loops avoided? The walker does not follow symlinks.
7. What happens after a syntax error? JavaScript extraction uses a conservative fallback.
8. What are static-analysis limits? Dynamic values cannot always be known without running code.
