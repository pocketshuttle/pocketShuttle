import { atom } from "recoil";

export const studentETA = atom<string | null>({
  key: "studentETA",
  default: null,
});
