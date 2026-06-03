import { toast } from "@/components/ui/use-toast";
import { appService } from "@/services/app-service";
import { useState } from "react";

const useUpdateAttendance = (studentId: string, method: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAtendance = async (
    attendance: string | object ,
    url: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const data = await appService<{ message?: string }>(url, {
        method: method as "POST" | "PUT" | "PATCH" | "DELETE",
        data: { attendance },
      });
      toast({
        title: "Marked",
        description: data.message,
      });

      return data;
    } catch (err) {
      if (err instanceof Error) {
        toast({
          title: "Failed",
          description: err.message,
        });
        setError(err.message);
      } else {
        setError("Unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return { updateAtendance, loading, error };
};
export default useUpdateAttendance;
