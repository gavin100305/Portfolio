import { Astronaut } from "@/components/ship-artwork";
import Link from "next/link";

export function SpaceInvitation() {
  return <section className="folio-space-invitation mt-16 sm:mt-20" aria-labelledby="space-invitation-title">
    <div className="folio-space-card">
      <div className="folio-space-id-stage" role="img" aria-label="Gavin Soares space explorer identification card with a pixel astronaut on a cobalt background">
        <div className="folio-space-id">
          <div className="folio-space-id-slot" />
          <div className="folio-space-id-heading"><span>GS / 01</span><span>STATION ACCESS</span></div>
          <div className="folio-space-id-portrait"><Astronaut palette="azure" /></div>
          <div className="folio-space-id-name">Gavin Soares</div>
          <div className="folio-space-id-meta"><span>Explorer</span><span className="folio-space-id-bars" /></div>
        </div>
      </div>
      <div className="folio-space-invitation-copy">
        <p className="folio-space-eyebrow">The interactive portfolio</p>
        <h2 id="space-invitation-title" className="text-xl font-medium tracking-tight">Take a look around.</h2>
        <p className="mt-2 text-xs leading-6 text-folio-muted">Explore the station, step into its rooms, and discover my work along the way.</p>
        <Link className="folio-raised-control folio-space-enter mt-5" href="/space">Explore space <span aria-hidden="true">↗</span></Link>
      </div>
    </div>
  </section>;
}
