import type { ComponentPropsWithRef } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { safeReturnTo } from "@/lib/auth-navigation";

export function AuthLink({
  children,
  mode = "login",
  returnTo,
  ...props
}: Omit<ComponentPropsWithRef<"a">, "href"> & { mode?: "login" | "signup"; returnTo?: string }) {
  const href = useRouterState({ select: (s) => s.location.href });
  const destination = returnTo ?? (href === "/" ? "/dashboard" : href);
  return (
    <Link
      {...props}
      target={props.target ?? "_self"}
      to="/auth"
      search={{ mode, returnTo: safeReturnTo(destination) }}
    >
      {children}
    </Link>
  );
}
