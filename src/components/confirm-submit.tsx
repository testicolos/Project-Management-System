"use client";

import type { ReactNode } from "react";

export function ConfirmSubmit({
  children,
  confirmText,
  className = "button danger",
}: {
  children: ReactNode;
  confirmText: string;
  className?: string;
}) {
  return <button className={className} type="submit" onClick={(event) => {
    if (!window.confirm(confirmText)) event.preventDefault();
  }}>{children}</button>;
}
