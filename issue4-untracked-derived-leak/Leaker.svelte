<script>
  // #18501 leak shape: a $derived chain whose ONLY read is a $state(...)
  // initializer — an untracked context. The chain subscribes to the shared
  // long-lived signal when first evaluated but never gains a reader of its
  // own, so on unmount nothing disconnects it. This is the same terminal
  // state as issue3 (#18420): CONNECTED with reactions === null.
  let { getSource } = $props();
  const raw = $derived(getSource());
  const normalized = $derived(raw?.trim() ?? null);
  const inferred = $derived(normalized ? normalized.toUpperCase() : null);
  // svelte-ignore state_referenced_locally
  let selected = $state(inferred ?? null); // ← sole read of the chain, untracked
</script>

<div>{selected}</div>
