<script>
  // Leak shape 1: the DEFAULT alone is enough. prop() reads props.path
  // during component init even though this component only ever touches
  // `path` inside an event handler (never in the template, never in a
  // reaction).
  let { path = '', title } = $props();
  function onclick() {
    console.log(path);
  }
</script>

<div role="button" tabindex="-1" {onclick}>{title}</div>
