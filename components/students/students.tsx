import { StudentsData } from "@/components/students/ui/Table";
import { getUserSession } from "@/lib/session";

export const Student = async () => {
    const user = await getUserSession();
    const userId = user?.id;

    if (!userId) {
        return null;
    }
  
    return (
        <div className="mt-2">
            <StudentsData userId={userId} />
        </div>
    );
};
