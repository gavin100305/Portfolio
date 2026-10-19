"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { AirlockDoor } from "@/components/airlock-door";
import { useSpaceMood } from "@/components/use-space-mood";

export function SpaceDepartureLink() {
  const [departing, setDeparting] = useState(false);
  const router = useRouter();
  const { mood } = useSpaceMood();
  const skipButton = useRef<HTMLButtonElement>(null);
  const navigating = useRef(false);
  const navigate = () => {
    if (navigating.current) return;
    navigating.current = true;
    router.push("/space");
  };
  useEffect(() => {
    if (!departing) return;
    const shell = document.querySelector<HTMLElement>(".professional-shell");
    const inert = shell?.inert;
    if (shell) shell.inert = true;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    skipButton.current?.focus({ preventScroll: true });
    const timer = setTimeout(() => {
      if (!navigating.current) {
        navigating.current = true;
        router.push("/space");
      }
    }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 180 : 1850);
    return () => {
      clearTimeout(timer);
      if (shell) shell.inert = inert ?? false;
      document.body.style.overflow = overflow;
    };
  }, [departing, router]);
  return <>
    <Link className="folio-raised-control folio-space-enter mt-5" href="/space" aria-busy={departing} onClick={event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      if (departing) return;
      router.prefetch("/space");
      setDeparting(true);
    }}>Explore space <span aria-hidden="true">↗</span></Link>
    {departing && createPortal(<div className="station-arrival station-departure" data-arrival="closing" data-mood={mood}>
      <AirlockDoor onSkip={navigate} skipButton={skipButton} status="Closing the airlock" skipLabel="Skip closing" />
    </div>, document.body)}
  </>;
}
