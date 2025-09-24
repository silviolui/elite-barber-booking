import { useState, useEffect, useRef } from 'react';

// Hook personalizado para prevenir erros de removeChild e race conditions
export const useSafeState = (initialState) => {
  const [state, setState] = useState(initialState);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setSafeState = (newState) => {
    if (isMountedRef.current) {
      if (typeof newState === 'function') {
        setState(prevState => {
          if (isMountedRef.current) {
            return newState(prevState);
          }
          return prevState;
        });
      } else {
        setState(newState);
      }
    }
  };

  return [state, setSafeState, isMountedRef.current];
};

// Hook para async operations seguras
export const useSafeAsync = () => {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeAsync = async (asyncFn) => {
    if (isMountedRef.current) {
      try {
        const result = await asyncFn();
        if (isMountedRef.current) {
          return result;
        }
      } catch (error) {
        if (isMountedRef.current) {
          throw error;
        }
      }
    }
    return null;
  };

  return { safeAsync, isMounted: isMountedRef.current };
};
