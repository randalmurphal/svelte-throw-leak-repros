import { it, expect } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import * as $ from 'svelte/internal/client';
import Host from './Host.svelte';

// Setting item.flag makes the row's text effect re-run; that update reads
// the never-before-evaluated `extra` derived (which connects itself to its
// deps eagerly) and THEN throws. The reader never reaches the end of its
// own update, so it never registers into `extra.reactions`. `extra` is now
// CONNECTED and present in its deps' reactions arrays with zero readers of
// its own: remove_reaction's disconnect cascade can never fire for it, and
// destroy_effect only walks effects' deps. The whole chain stays reachable
// through mapSig forever — surviving unmount() of the entire app.
function run(throwDuringRender) {
  const pane = $.proxy({ thread: { workspacePath: '/repo' } });
  const mapSig = $.state(new Map([['main', pane]]));
  const item = $.proxy({ key: 'n1', flag: false });

  const target = document.body.appendChild(document.createElement('div'));
  const app = mount(Host, {
    target,
    props: { getPane: () => $.get(mapSig).get('main'), item },
  });
  flushSync();

  if (throwDuringRender) {
    try {
      item.flag = true; // text effect re-runs: first-reads `extra`, then throws
      flushSync();
    } catch {}
  }

  unmount(app);
  flushSync();
  target.remove();
  return mapSig;
}

it('control: clean unmount leaves no subscribers', () => {
  const mapSig = run(false);
  expect(mapSig.reactions ?? []).toHaveLength(0); // passes
});

it('throwing template expression leaks the fresh derived it read', () => {
  const mapSig = run(true);
  // FAILS on 5.55.4 and 5.56.3: the Host-level `pane` derived is still
  // subscribed to mapSig after unmount, kept alive by the leaked row
  // derived one hop down (`extra`, whose own `reactions` is empty — so
  // the remove_reaction disconnect cascade can never reach it).
  expect(mapSig.reactions ?? []).toHaveLength(0);
});
