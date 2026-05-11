export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-6 mt-auto">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
        <p>© 2026 Cinelog. All rights reserved.</p>
        <p>
          This product uses the{" "}
          <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            TMDB API
          </a>
          {" "}but is not endorsed or certified by TMDB.
        </p>
      </div>
    </footer>
  );
}