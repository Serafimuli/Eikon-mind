import { LoginForm } from "./LoginForm"
import type { Locale } from "@/lib/site-content"
export const dynamic = "force-dynamic"
export default async function Login({params}:{params:Promise<{locale:Locale}>}){return <LoginForm locale={(await params).locale}/>}
