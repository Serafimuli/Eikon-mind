"use client"
import { useEffect, useState } from "react"
import { SiteHeader } from "./SiteHeader"
import type { Locale } from "@/lib/site-content"
export function HomeHeader({locale}:{locale:Locale}) { const [visible,setVisible]=useState(false); useEffect(()=>{const target=document.getElementById("home-logo-threshold");if(!target)return;const observer=new IntersectionObserver(([entry])=>setVisible(!entry.isIntersecting),{threshold:0});observer.observe(target);return()=>observer.disconnect()},[]); return <div className={visible?"home-header-wrap shown":"home-header-wrap"}><SiteHeader locale={locale} home/></div> }
