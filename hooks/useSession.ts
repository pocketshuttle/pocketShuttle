import { getUserSession } from "@/lib/session";
import { useEffect, useState } from "react";

// Define the expected type for the session
interface Session {
  id: string | null;
  name: string | null;
  image: string | undefined;
  role: string | undefined;
}

export const useSession = () => {
  const [id, setId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true); // Set loading to true before fetching
      try {
        const session = (await getUserSession()) as unknown as Session;
        setId(session?.id || undefined);
      } catch (error) {
        console.error("Error fetching session", error);
        setId(undefined); // Handle the case where there's an error
      } finally {
        setLoading(false); // Set loading to false once done
      }
    };

    fetchSession();
  }, []);
  return { id, loading };
};
