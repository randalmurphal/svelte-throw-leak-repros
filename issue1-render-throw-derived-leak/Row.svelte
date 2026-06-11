<script>
  let { pane, item } = $props();
  const base = $derived(pane?.thread?.workspacePath ?? '');
  const extra = $derived((pane?.thread?.workspacePath ?? '') + ':' + item.key);
  function boom(v) {
    if (item.flag) throw new Error('render boom');
    return v;
  }
</script>

<div>{item.flag ? boom(extra) : base}</div>
