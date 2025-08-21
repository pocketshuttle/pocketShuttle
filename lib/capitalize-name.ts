export const capitalizeName = (name: string): string => {
  if (!name) return name;

  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};
