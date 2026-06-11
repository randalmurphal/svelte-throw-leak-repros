# Svelte 5: user-code throws corrupt reactive-graph cleanup (two leaks)

Minimal reproductions for two Svelte 5 memory leaks, both of the shape
"an exception thrown by user code during reactive-graph maintenance leaves
the graph permanently half-linked":

| Folder | Bug | Lifetime of the leak |
| --- | --- | --- |
| [`issue1-render-throw-derived-leak/`](./issue1-render-throw-derived-leak) ([sveltejs/svelte#18414](https://github.com/sveltejs/svelte/issues/18414)) | A reaction throws after first-reading a fresh derived → the derived stays connected with zero readers | Forever — survives `unmount()` of the whole app |
| [`issue2-teardown-throw-strand/`](./issue2-teardown-throw-strand) ([sveltejs/svelte#18415](https://github.com/sveltejs/svelte/issues/18415)) | A `$effect` teardown throws while a keyed `{#each}` destroys a batch of leaving rows → the rest of the batch is never destroyed | Until the `{#each}` block itself is destroyed (the whole session for a long-lived list view) |

## Run

```sh
npm install   # or pnpm install
npm test
```

Each folder has a 2-test file: the **control** test passes (clean teardown
leaves zero subscribers), the **bug** test fails on svelte 5.56.3 — the
failing assertion shows the leaked subscriber count. Both bugs reproduce
identically on 5.55.4.

The tests meter the leak by inspecting `signal.reactions` via
`svelte/internal/client` — the same structures one finds retaining detached
DOM in production heap snapshots.

## Real-world impact

Found while debugging a desktop app (webview, Svelte 5.56.3) whose heap grew
to ~153 MB over one working session: a recurring render-time throw in a
virtualized list accumulated **1,499 copies of a single compiler-generated
prop derived** in one store signal's `reactions` array, transitively
retaining ~112 MB of detached DOM and component contexts (issue 1's
mechanism). Chrome's "Detached elements" view undercounts this kind of leak
because the DOM hangs off retained JS contexts rather than detached-tree
roots.
