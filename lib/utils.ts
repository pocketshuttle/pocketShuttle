import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const deleteItem = (data, itemId) => {
  const updatedData = data.filter((item) => item.id !== itemId);
  return updatedData;
};
