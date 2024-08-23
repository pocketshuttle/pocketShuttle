import { cache, useEffect, useState, useTransition } from "react";

export const useFetch = (url: string, userId: string | undefined) => {
  const [data, setData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // const [isPending, startTransition] = useTransition();
  const [isPending, setIsPending] = useState<boolean>(false);

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      setIsPending(true);
      try {
        const res = await fetch(url, { next: { tags: ["collection"] } });
        if (!res.ok) {
          throw new Error("Something went wrong");
        }
        const result = await res.json();
        setData(result);
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Unknown error occurred");
        }
      } finally {
        setIsPending(false);
      }
    };

    fetchData();
  }, [url, userId]);

  return { data, isPending, errorMessage };
};
