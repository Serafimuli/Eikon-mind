"use client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/site-content";
export function LogoutButton({ locale, label }: { locale: Locale; label: string }) {
  const r = useRouter();
  return (
    <button
      className="button button--secondary button--small"
      onClick={async () => {
        await authClient.signOut();
        r.replace(`/${locale}`);
        r.refresh();
      }}
    >
      {label}
    </button>
  );
}
