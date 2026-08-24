import { RegisterForm } from "./RegisterForm"
import type { Locale } from "@/lib/site-content"
export const dynamic = "force-dynamic"
export default async function Register({params}:{params:Promise<{locale:Locale}>}){return <RegisterForm locale={(await params).locale}/>}
