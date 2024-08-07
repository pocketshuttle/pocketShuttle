// utils/session.ts
import { auth } from "@/auth";
import authConfig from "@/auth.config";
import {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import { cache } from "react";

export const getUserSession = cache(
  async (
    ...args:
      | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
      | [NextApiRequest, NextApiResponse]
      | []
  ) => {

    const session = await auth();

    return session?.user;
  }
);
