import { useCallback, useRef, useEffect, useState } from 'react';

/**
 * Returns a debounced version of the callback.
 * The callback will only be called after the delay has passed without any new calls.
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number,
  options?: { flushOnUnmount?: boolean }
): T & { flush: () => void; cancel: () => void } {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  const argsRef = useRef<Parameters<T> | null>(null);
  const flushOnUnmount = options?.flushOnUnmount ?? false;

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    argsRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (argsRef.current) {
      callbackRef.current(...(argsRef.current as Parameters<T>));
      argsRef.current = null;
    }
  }, []);

  // Cleanup on unmount - flush if option is enabled
  useEffect(() => {
    return () => {
      if (flushOnUnmount) {
        flush();
      } else {
        cancel();
      }
    };
  }, [flushOnUnmount, flush, cancel]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      argsRef.current = args;

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        argsRef.current = null;
      }, delay);
    },
    [delay]
  );

  // Create the return object with flush and cancel methods
  // Using Object.assign to avoid modifying the callback after creation
  // eslint-disable-next-line react-hooks/refs
  return Object.assign(debouncedCallback, { flush, cancel }) as T & { flush: () => void; cancel: () => void };
}

/**
 * Returns a debounced value that only updates after the delay.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}
