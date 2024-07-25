import { toast } from "@/components/ui/use-toast";
import { useState } from "react";

const useUpdateAttendance = (studentId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAtendance = async (attendance: string, url: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ attendance }),
      });

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Marked",
          description: data.message,
        });
      } else {
        toast({
          title: "Marked",
          description: data.message,
        });
      }

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
