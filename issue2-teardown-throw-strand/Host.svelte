<script>
  import Row from './Row.svelte';
  let { getPane, getItems, getRange, shouldThrow } = $props();
  let pane = $derived(getPane());
  let visible = $derived.by(() => {
    const [start, end] = getRange();
    return getItems().slice(start, end + 1);
  });
</script>

{#each visible as item (item.key)}
  <Row {pane} {item} {shouldThrow} />
{/each}
