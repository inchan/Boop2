import { useLayoutEffect, useRef, useState } from 'react';

export function useOverflowTitle<T extends HTMLElement>(text: string) {
  const ref = useRef<T>(null);
  const [title, setTitle] = useState<string | undefined>();

  useLayoutEffect(() => {
    const element = ref.current;
    const overflowing = element ? element.scrollWidth > element.clientWidth : false;
    // Layout measurement requires reading the DOM in a layout effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(overflowing ? text : undefined);
  }, [text]);

  return { ref, title };
}
