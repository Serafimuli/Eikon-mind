"use server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { getAuth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { appointments } from "@/lib/db/schema"
import { requireAdmin, requireUser } from "@/lib/session"
import type { Locale } from "@/lib/site-content"
const safeDate=(date:string,time:string)=>{const value=new Date(`${date}T${time}:00+03:00`);if(Number.isNaN(value.getTime()))throw new Error("Invalid appointment time");return value}
export async function createAppointment(locale:Locale,formData:FormData){const user=await requireUser(locale);const startsAt=safeDate(String(formData.get("date")),String(formData.get("time")));const mode=String(formData.get("therapyMode")||"individual") as "individual"|"online"|"group";const now=new Date();await getDb().insert(appointments).values({id:crypto.randomUUID(),clientId:user.id,service:String(formData.get("service")),startsAt,status:"pending",therapist:String(formData.get("therapist")||"Eikon Mind"),therapyMode:mode,notes:String(formData.get("notes")||""),createdAt:now,updatedAt:now});revalidatePath(`/${locale}/client`);revalidatePath(`/${locale}/admin/appointments`);redirect(`/${locale}/client/appointments`)}
export async function updateAppointmentStatus(locale:Locale,id:string,status:"pending"|"confirmed"|"completed"|"cancelled"){await requireAdmin(locale);await getDb().update(appointments).set({status,updatedAt:new Date()}).where(eq(appointments.id,id));revalidatePath(`/${locale}/admin`);revalidatePath(`/${locale}/admin/appointments`)}
export async function deleteAppointment(locale:Locale,id:string){const user=await requireUser(locale);const db=getDb();const item=await db.query.appointments.findFirst({where:eq(appointments.id,id)});if(!item|| (user.role!=="admin"&&item.clientId!==user.id))throw new Error("Unauthorized");await db.delete(appointments).where(eq(appointments.id,id));revalidatePath(`/${locale}/client`);revalidatePath(`/${locale}/admin/appointments`)}
export async function logout(locale:Locale){await getAuth().api.signOut({headers:await import("next/headers").then(m=>m.headers())});redirect(`/${locale}`)}
