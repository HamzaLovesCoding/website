'use client';

import { useCallback, useState } from 'react';
import SmoothScroll from './SmoothScroll';
import Atmosphere from './Atmosphere';
import Cursor from './Cursor';
import Preloader from './Preloader';
import Header from './Header';
import Menu from './Menu';

/**
 * Everything that lives outside the document flow: scroll, lighting, cursor,
 * loader and navigation. Holds the single piece of shared UI state on the
 * page — whether the menu is open.
 */
export default function Chrome() {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <SmoothScroll />
      <Atmosphere />
      <Cursor />
      <Preloader />
      <Header open={open} onToggle={toggle} />
      <Menu open={open} onClose={close} />
    </>
  );
}
