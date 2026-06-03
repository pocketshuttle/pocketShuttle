import { appService } from "@/services/app-service";
import { useEffect, useState } from "react";

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
        const result = await appService(url);
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
