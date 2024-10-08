import { atom } from "recoil";

export const studentETA = atom<number | null>({
  key: "studentETA",
  default: null,
});
