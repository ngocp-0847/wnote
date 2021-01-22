// gkc_hash_code : 01DNDYY08Y2RN2YV33ABHHFNJJ
import { useEffect, useRef } from 'react';

export default function useEscape(handler) {
  const savedHandler = useRef();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = event => {
      if (event.keyCode === 27) {
        savedHandler.current(event);
      }
    };

    document.addEventListener('keydown', listener);

    return () => {
      document.removeEventListener('keydown', listener);
    };
  }, []);
}
