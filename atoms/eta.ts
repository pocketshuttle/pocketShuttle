import { atom } from "recoil";

export type EtaState = {
  value: number | null;
  status: "idle" | "loading" | "success" | "error";
};

export const studentETA = atom<EtaState>({
  key: "studentETA",
  default: { value: null, status: "idle" },
});
