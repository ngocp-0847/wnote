import { useLayoutEffect } from 'react';

export default function useDocumentTitle(title) {
  useLayoutEffect(() => {
    document.title = title;
  }, [title]);
}
