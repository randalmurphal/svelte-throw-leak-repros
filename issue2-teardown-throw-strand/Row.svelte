<script>
  let { pane, item, shouldThrow } = $props();
  const title = $derived(pane.title + ':' + item.key);

  $effect(() => {
    return () => {
      if (shouldThrow(item.key)) {
        throw new Error(`teardown boom for ${item.key}`);
      }
    };
  });
</script>

<div data-row>{title}</div>
