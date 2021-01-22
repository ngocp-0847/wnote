// gkc_hash_code : 01DNDYY08Y2RN2YV33ABHHFNJJ
import { useLayoutEffect } from 'react';

export default function useDocumentTitle(title) {
  useLayoutEffect(() => {
    document.title = title;
  }, [title]);
}
