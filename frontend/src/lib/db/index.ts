import "server-only"

import { getCloudflareContext } from "@opennextjs/cloudflare"
import { drizzle } from "drizzle-orm/d1"
import { cache } from "react"
import * as schema from "./schema"

export const getD1 = cache(() => getCloudflareContext().env.DB)

export const getDb = cache(() => {
  return drizzle(getD1(), { schema })
})

export type Database = ReturnType<typeof getDb>
