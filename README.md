# Svelte 5: reactive-graph leak reproductions

Minimal reproductions for three Svelte 5 memory leaks. All three share the
final state — a derived left **connected into its dependencies' `reactions`
arrays with zero subscribers of its own**, which `remove_reaction`'s
disconnect cascade can never reach — but they get there differently: the
first two need an exception thrown by user code at an unlucky moment; the
third needs no exception at all.

| Folder | Bug | Lifetime of the leak |
| --- | --- | --- |
| [`issue1-render-throw-derived-leak/`](./issue1-render-throw-derived-leak) ([sveltejs/svelte#18414](https://github.com/sveltejs/svelte/issues/18414)) | A reaction throws after first-reading a fresh derived → the derived stays connected with zero readers | Forever — survives `unmount()` of the whole app |
| [`issue2-teardown-throw-strand/`](./issue2-teardown-throw-strand) ([sveltejs/svelte#18415](https://github.com/sveltejs/svelte/issues/18415)) | A `$effect` teardown throws while a keyed `{#each}` destroys a batch of leaving rows → the rest of the batch is never destroyed | Until the `{#each}` block itself is destroyed (the whole session for a long-lived list view) |
| [`issue3-init-read-connect-leak/`](./issue3-init-read-connect-leak) ([sveltejs/svelte#18420](https://github.com/sveltejs/svelte/issues/18420)) | **No throw required.** An init-time read of a prop backed by a parent prop-expression memo — a prop *default* alone triggers it via `prop()` — evaluates the memo unconnected while `is_updating_effect` is true; every derived the memo reads gets force-connected with an unregisterable reader | Forever — survives `unmount()`; one zombie chain per component instance ever created |

## Run

```sh
npm install   # or pnpm install
npm test
```

Each folder has a self-contained test file: the **control** tests pass
(clean teardown leaves zero subscribers), the **bug** tests fail on svelte
5.56.3 — the failing assertion shows the leaked subscriber count. Issues 1
and 2 reproduce identically on 5.55.4.

The tests meter the leak by inspecting `signal.reactions` via
`svelte/internal/client` — the same structures one finds retaining detached
DOM in production heap snapshots.

## Real-world impact

Found while debugging a desktop app (webview, Svelte 5.56.3). Issue 1's
mechanism accumulated 1,499 copies of a single compiler-generated prop
derived in one store signal's `reactions` array (~112 MB retained). After
fixing the app-side throw, the heap kept growing anyway — issue 3 turned
out to be the dominant source: **every mount of a component with a
defaulted prop fed by a prop expression** minted zombie deriveds, ~3,700
per hour of normal use, growing one session to **615 MB / 785k detached DOM
nodes, 85% of the heap (~520 MB) retained purely by zombie subscriber
chains**. Chrome's "Detached elements" view undercounts this kind of leak
because the DOM hangs off retained JS contexts rather than detached-tree
roots.
