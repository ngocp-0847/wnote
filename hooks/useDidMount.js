import { useEffect } from 'react';

export default function useDidMount(effect) {
  useEffect(() => {
    effect();
  }, []); // eslint-disable-line
}
