import { useEffect } from "react"
import { useLocation } from "react-router"

export default function ScrollManager() {
  const location = useLocation()

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const targetId = location.hash.replace(/^#/, "")
      const target = targetId ? document.getElementById(targetId) : null

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" })
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [location.hash, location.pathname, location.search])

  return null
}
