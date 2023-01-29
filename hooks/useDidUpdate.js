import { useEffect, useRef } from 'react';

export default function useDidUpdate(effect, deps) {
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      effect();
    }
  }, deps); // eslint-disable-line
}
