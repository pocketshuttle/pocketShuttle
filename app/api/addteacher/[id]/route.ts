import { connectToDB } from "@/utils/connect-to-db";
import { NextRequest, NextResponse } from "next/server";
import Teacher from "@/(models)/Teachers";
type ParamProp = {
  id: string;
};
export const GET = async (
  req: NextRequest,
  { params }: { params: ParamProp }
) => {
  try {
    await connectToDB();
    const { id } = params;
    const teacher = await Teacher.find(id);

    return new Response(JSON.stringify(teacher), {
      status: 200,
    });
  } catch (error) {
    console.log(error);
  }
};
