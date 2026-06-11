import { it, expect } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import * as $ from 'svelte/internal/client';
import Host from './Host.svelte';

// Slides a 6-row window over a keyed {#each} by 2 rows per step (the shape
// of any virtualized list), so each reconcile destroys a batch of 2 leaving
// rows. With throwKey set, that row's $effect teardown throws while its
// batch is destroyed; destroy_effects' loop in each.js aborts, so the OTHER
// row of the batch is never destroyed: it stays subscribed to its deps and
// holds its (now detached) DOM for as long as the each block lives. Later
// reconciles never revisit it. Only a full unmount of the block sweeps it.
function run(throwKey) {
  const pane = { title: 'pane' };
  const mapSig = $.state(new Map([['main', pane]]));
  const items = Array.from({ length: 40 }, (_, i) => ({ key: `n${i}` }));
  const rangeSig = $.state([0, 5]);

  const target = document.body.appendChild(document.createElement('div'));
  const app = mount(Host, {
    target,
    props: {
      getPane: (id) => $.get(mapSig).get('main'),
      getItems: () => items,
      getRange: () => $.get(rangeSig),
      shouldThrow: (key) => key === throwKey,
    },
  });
  flushSync();

  let thrown = 0;
  for (let cycle = 0; cycle < 8; cycle++) {
    const [start, end] = $.get(rangeSig);
    try {
      $.set(rangeSig, [start + 2, end + 2]);
      flushSync();
    } catch {
      thrown += 1;
    }
  }
  if (throwKey) expect(thrown).toBe(1); // threw once; later reconciles never revisit

  const paneDerived = (mapSig.reactions ?? []).find((r) => 'equals' in r && 'rv' in r);
  const mountedSubscribers = paneDerived?.reactions?.length ?? 0;
  const attachedRows = target.querySelectorAll('[data-row]').length;

  let unmountThrew = false;
  try {
    unmount(app);
    flushSync();
  } catch {
    unmountThrew = true;
  }
  target.remove();
  return { mapSig, mountedSubscribers, attachedRows, unmountThrew };
}

it('control: window slides keep a stable subscriber count', () => {
  const { mapSig, mountedSubscribers, attachedRows, unmountThrew } = run(null);
  expect(attachedRows).toBe(6);
  expect(mountedSubscribers).toBe(6); // 6 visible rows x 1 derived subscription
  expect(unmountThrew).toBe(false);
  expect(mapSig.reactions ?? []).toHaveLength(0);
});

it('a throwing teardown strands the rest of its destroy batch', () => {
  const { mapSig, mountedSubscribers, attachedRows, unmountThrew } = run('n2');
  expect(attachedRows).toBe(6); // DOM looks fine — the strand is invisible
  expect(unmountThrew).toBe(false);
  expect(mapSig.reactions ?? [], 'subscribers surviving unmount').toHaveLength(0);
  // FAILS on 5.56.3: 7 — n3 (destroyed after n2 in the same batch) is
  // stranded: subscribed and retaining its detached DOM for the lifetime
  // of the each block.
  expect(mountedSubscribers).toBe(6);
});
