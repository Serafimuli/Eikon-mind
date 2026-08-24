import "server-only"

import { getCloudflareContext } from "@opennextjs/cloudflare"
import { drizzle } from "drizzle-orm/d1"
import { cache } from "react"
import * as schema from "./schema"

export const getDb = cache(() => {
  const { env } = getCloudflareContext()
  return drizzle(env.DB, { schema })
})

export type Database = ReturnType<typeof getDb>
