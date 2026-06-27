import { atom, selectorFamily } from "recoil";

export type EtaState = {
  value: number | null;
  status: "idle" | "loading" | "success" | "error";
};

// export const studentETA = atom<EtaState>({
//   key: "studentETA",
//   default: { value: null, status: "idle" },
// });

export const studentETA = atom<Record<string, EtaState>>({
  key: "studentETAs",
  default: {},
  effects_UNSTABLE: [
    ({ onSet, setSelf }) => {
      if (typeof window === "undefined") return; 

      // Load from localStorage on mount
      const saved = localStorage.getItem("studentETA");
      if (saved) {
        try {
          setSelf(JSON.parse(saved));
        } catch {
          localStorage.removeItem("studentETA");
        }
      }

      // Persist whenever state changes
      onSet((newValue) => {
        localStorage.setItem("studentETA", JSON.stringify(newValue));
      });
    },
  ],
});

export const studentETASelector = selectorFamily({
  key: "studentETASelector",
  get:
    (userId: string) =>
    ({ get }) => {
      const etas = get(studentETA);
      return etas[userId] || { value: null, status: "idle" };
    },
});
