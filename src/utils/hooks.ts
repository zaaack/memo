import { useEffect, useState } from "react";

export interface QueryErrorData<T> {
  data: null;
  isLoading: boolean;
  error: Error | null;
  invalid: () => void;
}

export interface QuerySuccessData<T> {
  data: T;
  isLoading: false;
  error: null;
  invalid: () => void;
}
export type QueryData<T> = QueryErrorData<T> | QuerySuccessData<T>;
export function useQuery<T>(query: () => Promise<T>, deps: any[]) {
  const [state, setState] = useState<QueryData<T>>({
    data: null,
    isLoading: true,
    error: null,
    invalid,
  });

  function invalid() {
    setState({
      data: null,
      isLoading: true,
      error: null,
      invalid,
    });
    query()
      .then((d) => {
        setState({
          data: d,
          isLoading: false,
          error: null,
          invalid,
        });
      })
      .catch((err) => {
        setState({
          data: null,
          isLoading: false,
          error: err,
          invalid,
        });
      });
  }
  useEffect(invalid, deps);
  return state;
}
