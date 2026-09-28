import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

export function useRefreshOnFocus(refetch: () => void) {
  const firstTime = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstTime.current) {
        firstTime.current = false;
        return;
      }
      refetch();
    }, [refetch])
  );
}
