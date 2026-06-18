"use client";

import { ReactNode, useState } from "react";

const iconPaths = {
  car: "/magnific-icons/car.svg",
  check: "/magnific-icons/check.svg",
  clock: "/magnific-icons/clock.svg",
  mail: "/magnific-icons/mail.svg",
  mapPin: "/magnific-icons/location.svg",
  phone: "/magnific-icons/phone.svg",
  save: "/magnific-icons/save.svg",
  search: "/magnific-icons/search.svg",
  shield: "/magnific-icons/shield.svg",
  trash: "/magnific-icons/trash.svg",
  user: "/magnific-icons/user.svg",
  users: "/magnific-icons/users.svg",
  x: "/magnific-icons/x.svg",
} as const;

export type MagnificIconName = keyof typeof iconPaths;

type MagnificIconProps = {
  name: MagnificIconName;
  fallback: ReactNode;
  className?: string;
  alt?: string;
};

export function MagnificIcon({ name, fallback, className, alt = "" }: MagnificIconProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <>{fallback}</>;
  }

  return (
    // Magnific/Freepik stock icons should be downloaded into public/magnific-icons.
    // Free PNG assets require attribution unless the project uses a Premium license.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={iconPaths[name]} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}
