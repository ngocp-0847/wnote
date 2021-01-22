// gkc_hash_code : 01DNDYY08Y2RN2YV33ABHHFNJJ
import { useEffect } from 'react';

export default function useEffectOnce(effect) {
  useEffect(effect, []); // eslint-disable-line
}
