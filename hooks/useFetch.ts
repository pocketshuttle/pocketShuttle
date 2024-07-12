import { useEffect, useState, useTransition } from "react";

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
        const res = await fetch(url);
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
    //   startTransition(() => {
    //     fetch(url)
    //       .then((res) => {
    //         if (res.ok) {
    //           return res.json();
    //         } else {
    //           return res.json().then((err) => {
    //             throw new Error(err.message);
    //           });
    //         }
    //       })
    //       .then((result) => {
    //         setData(result);
    //       })
    //       .catch((error) => {
    //         if (error instanceof Error) {
    //           setErrorMessage(error.message);
    //         } else {
    //           setErrorMessage("Unknown error occurred");
    //         }
    //       });
    //   });
  }, [url, userId]);

  return { data, isPending, errorMessage };
};
