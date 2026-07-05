<script>
  // Healthy control: #18501's other listed control — initialize the $state
  // to a constant so the chain is never read. The deriveds are created but
  // their fns never run, so they never subscribe to the shared signal.
  let { getSource } = $props();
  const raw = $derived(getSource());
  const normalized = $derived(raw?.trim() ?? null);
  const inferred = $derived(normalized ? normalized.toUpperCase() : null);
  let selected = $state(null); // never reads the chain
</script>

<div>{selected}</div>
