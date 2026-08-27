import Link from "next/link";
export default function NotFound() {
  return (
    <main className="page-hero">
      <p className="eyebrow">404</p>
      <h1>Pagina nu a fost găsită</h1>
      <Link className="button" href="/ro">
        Acasă
      </Link>
    </main>
  );
}
