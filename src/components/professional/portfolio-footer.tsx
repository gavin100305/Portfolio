import { profile } from "@/data/portfolio-content";
import { ResumeButton } from "./resume-button";

export function PortfolioFooter() {
  return <footer className="folio-footer">
    <p className="folio-footer-signoff">Thanks for stopping by.</p>
    <div className="folio-footer-links">
      <a href={profile.github} target="_blank" rel="noopener noreferrer" className="folio-footer-link" aria-label="GitHub — gavin100305"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.82c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" /></svg><span>GitHub</span><span aria-hidden="true">↗</span></a>
      <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="folio-footer-link" aria-label="LinkedIn — Gavin Soares"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M7.5 10v7M7.5 7v.2M12 17v-7m0 3a3 3 0 0 1 6 0v4" /></svg><span>LinkedIn</span><span aria-hidden="true">↗</span></a>
      <a href={`mailto:${profile.email}`} className="folio-footer-link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg><span>Email</span><span aria-hidden="true">↗</span></a>
      <ResumeButton className="folio-footer-resume folio-raised-control-primary" />
    </div>
    <div className="folio-footer-bottom"><span>© {new Date().getFullYear()} Gavin Soares</span><a href="#home" className="folio-text-link">Back to top <span aria-hidden="true">↑</span></a></div>
  </footer>;
}
