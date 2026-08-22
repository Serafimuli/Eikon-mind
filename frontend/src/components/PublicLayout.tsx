import { Outlet } from "react-router"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import ScrollManager from "@/components/ScrollManager"

export default function PublicLayout() {
  return (
    <div className="public-shell">
      <ScrollManager />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
