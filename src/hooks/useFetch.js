import { useState, useEffect, useCallback, useRef } from 'react';

// fetcher: 데이터를 가져오는 함수 (Promise 반환)
// deps: 의존성 배열 (의존성이 바뀌면 자동으로 재요청)
export default function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0); // refetch 트리거
  const mountedRef = useRef(true);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    mountedRef.current = true;

    queueMicrotask(() => {
      if (!mountedRef.current) return;
      setLoading(true);
      setError(null);

      fetcher()
        .then((res) => {
          if (!mountedRef.current) return;
          setData(res);
        })
        .catch((err) => {
          if (!mountedRef.current) return;
          setError(err);
        })
        .finally(() => {
          if (!mountedRef.current) return;
          setLoading(false);
        });
    });

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, loading, error, refetch };
}
