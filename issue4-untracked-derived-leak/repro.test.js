import { it, expect } from 'vitest';
import { mount, unmount, flushSync } from 'svelte';
import * as $ from 'svelte/internal/client';
import Leaker from './Leaker.svelte';
import LeakerTracked from './LeakerTracked.svelte';
import LeakerNoRead from './LeakerNoRead.svelte';

// Issue #18501 (near-sibling of issue3 / #18420). A $derived chain read ONLY
// from a $state(...) initializer subscribes to its dependencies but never
// gains a reaction of its own. On unmount, remove_reaction's disconnect
// cascade never fires for a derived that never had a reaction — so each
// mount/unmount cycle strands one more subscriber on the shared long-lived
// signal, unbounded. (Reporter's prod app: page.url.reactions grew to 177 in
// a day-old tab, each stale subscription pinning a detached page subtree.)
//
// The shared signal is created OUTSIDE the component and survives every
// unmount, so its reactions[] is where stranded subscribers accumulate.
function cycles(Component, n = 3) {
  const sharedSig = $.state('  hello  ');
  const getSource = () => $.get(sharedSig);
  for (let i = 0; i < n; i++) {
    const target = document.body.appendChild(document.createElement('div'));
    const app = mount(Component, { target, props: { getSource } });
    flushSync();
    unmount(app);
    flushSync();
    target.remove();
  }
  return sharedSig;
}

it('healthy control: a tracked (template) read disconnects on unmount', () => {
  const sharedSig = cycles(LeakerTracked);
  expect(sharedSig.reactions ?? []).toHaveLength(0);
});

it('healthy control: never reading the chain leaves no subscribers', () => {
  const sharedSig = cycles(LeakerNoRead);
  expect(sharedSig.reactions ?? []).toHaveLength(0);
});

it('a $derived read only from a $state(...) initializer strands one subscriber per cycle', () => {
  const sharedSig = cycles(Leaker, 3);
  // FAILS on 5.56.3: one stranded reaction per mount/unmount cycle
  // (here: 3). Passes with the #18420 fix, which stops connecting a derived
  // read by an unconnected reader.
  expect(sharedSig.reactions ?? []).toHaveLength(0);
});
