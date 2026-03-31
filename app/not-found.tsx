import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background font-sans">
      <div className="text-center p-12">
        <div className="text-8xl font-serif text-foreground/10 mb-6">404</div>
        <h1 className="text-3xl font-serif text-foreground mb-4">Page Not Found</h1>
        <p className="text-foreground/50 font-light mb-8 max-w-md mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-[8px] font-semibold text-xs uppercase tracking-widest transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
