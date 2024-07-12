import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";

export const usePost = (
  url: string,
  value: string | undefined,
  method: string
) => {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const postData = async () => {
      try {
        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(value),
        });
        const data = await response.json();
        if (response.ok) {
          setData(data);
          setIsSuccess(true);
          toast({
            title: "Added Successfully",
            description: data.message,
          });
        } else {
          toast({
            title: "Failed",
            description: data.message,
          });
          setIsSuccess(false);
        }
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        }
      } finally {
        setLoading(false);
      }
    };
    if (value) {
      postData();
    }
  }, [url, value, method]);

  return { data, loading, errorMessage, success };
};
