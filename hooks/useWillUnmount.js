import { useEffect } from 'react';

export default function useWillUnmount(effect) {
  useEffect(() => effect, []); // eslint-disable-line
}
