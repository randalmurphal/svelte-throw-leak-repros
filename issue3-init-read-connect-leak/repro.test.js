import { it, expect } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import * as $ from 'svelte/internal/client';
import Parent from './Parent.svelte';

// No throws anywhere — this is plain mount/unmount. During component
// init, active_reaction is null, and component creation runs inside an
// effect update, so is_updating_effect is true. prop()'s init-time read
// (or any explicit init-time read) evaluates the parent's
// prop-expression memo, which executes UNCONNECTED (should_connect was
// false for it: active_reaction was null). While the memo runs,
// active_reaction is the unconnected memo itself — so every derived the
// memo reads passes should_connect via the `is_updating_effect ||`
// disjunct in get() (runtime.js), takes the connect-dirty path, and is
// registered into ITS deps' reactions. But the unconnected memo never
// registers into the connected derived's own reactions (update_reaction
// only registers CONNECTED readers), so that derived ends up subscribed
// with zero subscribers of its own. remove_reaction's disconnect
// cascade can never reach it — the subscription is permanent. The chain
// (here: Parent's `pane` derived) stays subscribed to mapSig forever,
// surviving unmount() — one fresh zombie per mount/destroy cycle.
function run(variant, rows = 3) {
  const pane = $.proxy({ thread: { workspacePath: '/repo' } });
  const mapSig = $.state(new Map([['main', pane]]));
  const items = Array.from({ length: rows }, (_, i) => ({
    key: `n${i}`,
    title: `row ${i}`,
    variant,
  }));

  const target = document.body.appendChild(document.createElement('div'));
  const app = mount(Parent, {
    target,
    props: { getPane: () => $.get(mapSig).get('main'), items },
  });
  flushSync();

  unmount(app);
  flushSync();
  target.remove();
  return mapSig;
}

it('healthy control: template-read prop leaves no subscribers', () => {
  const mapSig = run('template-read');
  expect(mapSig.reactions ?? []).toHaveLength(0); // passes
});

it('a prop DEFAULT leaks zombie subscribers — no app code reads it at init', () => {
  const mapSig = run('default');
  // FAILS on 5.56.3: prop()'s own init read evaluated the parent memo
  // unconnected; Parent's `pane` derived is permanently subscribed.
  expect(mapSig.reactions ?? []).toHaveLength(0);
});

it('an explicit init-time read of a plain prop leaks identically', () => {
  const mapSig = run('init-read');
  // FAILS on 5.56.3: the default is not the ingredient — the init-time
  // unconnected read is.
  expect(mapSig.reactions ?? []).toHaveLength(0);
});
