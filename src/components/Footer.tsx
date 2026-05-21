export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-8 sm:py-10 mt-auto">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-white">
        <span>© 2026 CritCine. Todos os direitos reservados.</span>
        <span>Este produto usa a <a href="https://www.themoviedb.org/" className="text-primary hover:underline">API do TMDB</a> mas não é endossado ou certificado pelo TMDB.</span>
      </div>
    </footer>
  );
}