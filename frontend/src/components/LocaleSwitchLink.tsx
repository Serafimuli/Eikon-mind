"use client";

import Link from "next/link";
import type { Route } from "next";
import { useSearchParams } from "next/navigation";
import { Suspense, type MouseEventHandler } from "react";
import { localizeAuthDestination } from "@/lib/auth-routing";
import type { Locale } from "@/lib/site-content";

type LocaleSwitchLinkProps = {
  locale: Locale;
  targetLocale: Locale;
  currentPath: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

function SearchAwareLocaleSwitchLink({
  locale,
  targetLocale,
  currentPath,
  onClick,
}: LocaleSwitchLinkProps) {
  const searchParams = useSearchParams();
  const query = new URLSearchParams();

  if (currentPath === "/reset-password") {
    const token = searchParams.get("token");
    if (token) query.set("token", token);
  } else if (currentPath === "/login" || currentPath === "/two-factor") {
    const returnTo = localizeAuthDestination(searchParams.get("returnTo"), locale, targetLocale);
    if (returnTo) query.set("returnTo", returnTo);
  }

  const suffix = query.size ? `?${query.toString()}` : "";
  const href = `/${targetLocale}${currentPath === "/" ? "" : currentPath}${suffix}` as Route;

  return (
    <Link className="locale-switch" href={href} prefetch={false} onClick={onClick}>
      {targetLocale.toUpperCase()}
    </Link>
  );
}

export function LocaleSwitchLink(props: LocaleSwitchLinkProps) {
  const fallbackHref =
    `/${props.targetLocale}${props.currentPath === "/" ? "" : props.currentPath}` as Route;

  return (
    <Suspense
      fallback={
        <Link
          className="locale-switch"
          href={fallbackHref}
          prefetch={false}
          onClick={props.onClick}
        >
          {props.targetLocale.toUpperCase()}
        </Link>
      }
    >
      <SearchAwareLocaleSwitchLink {...props} />
    </Suspense>
  );
}
