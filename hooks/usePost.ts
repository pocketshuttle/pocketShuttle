import { useToast } from "@/components/ui/use-toast";
import { appService } from "@/services/app-service";
import { useEffect, useState } from "react";

export const usePost = (
  url: string,
  value: object | undefined,
  method: string
) => {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const postData = async () => {
      setLoading(true); // Set loading true when postData starts

      try {
        const data = await appService<{ message?: string }>(url, {
          method: method as "POST" | "PUT" | "PATCH" | "DELETE",
          data: value,
        });
        setData(data as never);
        setIsSuccess(true);
        toast({
          title: "Saved Successfully",
          description: data.message,
        });
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
          toast({
            title: "Failed",
            description: error.message,
          });
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
