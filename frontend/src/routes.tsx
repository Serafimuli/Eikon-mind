import { createBrowserRouter, Navigate } from "react-router"
import PublicLayout from "@/components/PublicLayout"
import ClientLayout from "@/components/ClientLayout"
import AdminLayout from "@/components/AdminLayout"
import Home from "@/pages/Home"
import About from "@/pages/About"
import Services from "@/pages/Services"
import TherapyTypes from "@/pages/TherapyTypes"
import PrivacyPolicy from "@/pages/PrivacyPolicy"
import TermsOfService from "@/pages/TermsOfService"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import ClientDashboard from "@/pages/client/ClientDashboard"
import MyAppointments from "@/pages/client/MyAppointments"
import AppointmentDetail from "@/pages/client/AppointmentDetail"
import BookAppointment from "@/pages/client/BookAppointment"
import Profile from "@/pages/client/Profile"
import AdminDashboard from "@/pages/admin/AdminDashboard"
import AdminAppointments from "@/pages/admin/AdminAppointments"
import AddAppointment from "@/pages/admin/AddAppointment"
import NotFound from "@/pages/NotFound"

export const router = createBrowserRouter([
  {
    path: "/",
    Component: PublicLayout,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
      { path: "services", Component: Services },
      { path: "therapy", Component: TherapyTypes },
      { path: "privacy", Component: PrivacyPolicy },
      { path: "terms", Component: TermsOfService },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
    ],
  },
  {
    path: "/client",
    Component: ClientLayout,
    children: [
      { index: true, Component: ClientDashboard },
      { path: "appointments", Component: MyAppointments },
      { path: "appointments/:id", Component: AppointmentDetail },
      { path: "book", Component: BookAppointment },
      { path: "profile", Component: Profile },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "appointments", Component: AdminAppointments },
      { path: "add", Component: AddAppointment },
    ],
  },
  { path: "/404", Component: NotFound },
  { path: "*", element: <Navigate to="/404" replace /> },
])
