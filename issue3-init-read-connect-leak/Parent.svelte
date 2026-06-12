<script>
  import Child from './Child.svelte';
  import ChildInitRead from './ChildInitRead.svelte';
  import ChildTemplateRead from './ChildTemplateRead.svelte';
  let { getPane, items } = $props();
  let pane = $derived(getPane());
  function paneWorkspacePath(p) {
    return p?.thread?.workspacePath ?? '';
  }
</script>

{#each items as item (item.key)}
  {#if item.variant === 'default'}
    <Child path={paneWorkspacePath(pane)} title={item.title} />
  {:else if item.variant === 'init-read'}
    <ChildInitRead path={paneWorkspacePath(pane)} title={item.title} />
  {:else}
    <ChildTemplateRead path={paneWorkspacePath(pane)} title={item.title} />
  {/if}
{/each}
