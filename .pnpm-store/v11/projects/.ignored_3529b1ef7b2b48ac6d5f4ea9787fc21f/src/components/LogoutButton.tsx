"use client"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import type { Locale } from "@/lib/site-content"
export function LogoutButton({locale}:{locale:Locale}){const r=useRouter();return <button className="icon-button" onClick={async()=>{await authClient.signOut();r.replace(`/${locale}`);r.refresh()}}>Logout</button>}
