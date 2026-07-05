<script>
  // Healthy control: the template reads the end of the chain, so a connected
  // reader (the text effect) subscribes the whole chain and unmount's
  // remove_reaction cascade fully disconnects it.
  let { getSource } = $props();
  const raw = $derived(getSource());
  const normalized = $derived(raw?.trim() ?? null);
  const inferred = $derived(normalized ? normalized.toUpperCase() : null);
</script>

<div>{inferred}</div>
