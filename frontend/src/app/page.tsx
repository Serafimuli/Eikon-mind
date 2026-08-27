import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export default async function Index() {
  const jar = await cookies();
  redirect(`/${jar.get("eikon-locale")?.value === "en" ? "en" : "ro"}`);
}
