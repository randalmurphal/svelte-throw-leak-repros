<script>
  import Row from './Row.svelte';
  let { getPane, item } = $props();
  let pane = $derived(getPane());
</script>

{#if pane}<Row {pane} {item} />{/if}
