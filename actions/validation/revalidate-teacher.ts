// "use server";

// import { revalidateTag } from "next/cache";
// import { redirect } from "next/navigation";

// export async function revalidateStudent() {
//   revalidateTag("students");
//   redirect("http://localhost:3000/dashboard/students");
// }

"use server";

import { revalidateTag } from "next/cache";

async function revalidateData(name: string) {
  revalidateTag(name);
}

export default revalidateData;
