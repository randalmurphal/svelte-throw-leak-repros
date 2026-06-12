<script>
  // Healthy control: the template reads the prop, so a connected reader
  // (the text effect) subscribes the whole chain, and unmount's
  // remove_reaction cascade fully disconnects it.
  let { path = '', title } = $props();
</script>

<div>{title}: {path}</div>
