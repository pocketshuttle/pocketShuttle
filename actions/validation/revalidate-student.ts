// "use server";

// import { revalidateTag } from "next/cache";
// import { redirect } from "next/navigation";

// export async function revalidateStudent() {
//   revalidateTag("students");
//   redirect("http://localhost:3000/dashboard/students");
// }

"use server";

import { revalidateTag as revalidate } from "next/cache";

async function revalidateStudent(name: string) {
  revalidate(name);
}

export default revalidateStudent;
