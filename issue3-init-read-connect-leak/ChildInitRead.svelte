<script>
  // Leak shape 2: no default — an explicit init-time read of the
  // memo-backed prop leaks identically. The default in shape 1 just
  // guarantees such a read happens.
  let { path, title } = $props();
  // svelte-ignore state_referenced_locally
  const initialLength = path.length;
</script>

<div>{title} ({initialLength})</div>
