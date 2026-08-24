"use client"
import { useEffect, useState } from "react"
export function ThemeToggle() {
 const [dark,setDark]=useState(false)
 useEffect(()=>setDark(document.documentElement.classList.contains("dark")),[])
 const toggle=()=>{const next=!dark;setDark(next);document.documentElement.classList.toggle("dark",next);localStorage.setItem("eikon-theme",next?"dark":"light")}
 return <button className="icon-button" type="button" onClick={toggle} aria-label="Toggle theme">{dark?"☀":"☾"}</button>
}
