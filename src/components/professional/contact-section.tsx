"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { profile } from "@/data/portfolio-content";

type SendState = "idle" | "sending" | "success" | "error";

export function ContactSection() {
  const [state, setState] = useState<SendState>("idle");
  const [feedback, setFeedback] = useState("");
  const inFlight = useRef(false);

  useEffect(() => {
    if (state !== "success") return;
    const timeout = setTimeout(() => {
      setState("idle");
      setFeedback("");
    }, 4500);
    return () => clearTimeout(timeout);
  }, [state]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    if (String(fields.get("website") ?? "").trim()) return;
    const name = String(fields.get("name") ?? "").trim();
    const email = String(fields.get("email") ?? "").trim();
    const message = String(fields.get("message") ?? "").trim();
    if (name.length < 2 || message.length < 10) {
      setState("error");
      setFeedback("Please add your name and a message of at least 10 characters.");
      return;
    }

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    if (!serviceId || !templateId || !publicKey) {
      setState("error");
      setFeedback("The form is temporarily unavailable. You can email me directly below.");
      return;
    }

    inFlight.current = true;
    setState("sending");
    setFeedback("Sending your message…");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: { name, email, message },
        }),
      });
      if (!response.ok) {
        setState("error");
        setFeedback(response.status === 429
          ? "Too many messages at once. Please wait a moment, or email me directly."
          : "Your message couldn’t be sent. Please try again, or email me directly.");
        return;
      }
      form.reset();
      setState("success");
      setFeedback("Message sent. Thanks for reaching out!");
    } catch {
      setState("error");
      setFeedback("Couldn’t confirm delivery. Please check your connection, or email me directly.");
    } finally {
      clearTimeout(timeout);
      inFlight.current = false;
    }
  }

  return <section id="contact" className="folio-contact mt-16 sm:mt-20" aria-labelledby="contact-title">
    <div className="mb-6 sm:mb-7">
      <h2 id="contact-title" className="text-xl font-medium tracking-tight">Let’s talk.</h2>
      <p className="mt-3 text-xs leading-6 text-folio-muted">Have a project or opportunity in mind? Send me a message.</p>
    </div>
    <div className="folio-contact-panel">
      <form className="folio-contact-form" onSubmit={sendMessage} aria-busy={state === "sending"} onChange={() => {
        if (state === "success") { setState("idle"); setFeedback(""); }
      }}>
        <div className="folio-contact-fields">
          <label className="folio-contact-field" htmlFor="contact-name">
            <span>Name</span>
            <input id="contact-name" name="name" type="text" autoComplete="name" placeholder="Your name" required minLength={2} maxLength={80} readOnly={state === "sending"} />
          </label>
          <label className="folio-contact-field" htmlFor="contact-email">
            <span>Email</span>
            <input id="contact-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} readOnly={state === "sending"} />
          </label>
          <label className="folio-contact-field folio-contact-message" htmlFor="contact-message">
            <span>Message</span>
            <textarea id="contact-message" name="message" placeholder="What would you like to work on?" required minLength={10} maxLength={5000} rows={5} readOnly={state === "sending"} />
          </label>
        </div>
        <div className="folio-contact-trap" aria-hidden="true">
          <label htmlFor="contact-website">Leave this field empty</label>
          <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <div className="folio-contact-actions" data-send-state={state}>
          <button type="submit" disabled={state === "sending"} data-send-state={state} className="folio-raised-control folio-raised-control-primary folio-contact-send">
            {state === "sending" ? "Sending…" : state === "success" ? "Message sent" : "Send message"}
            <span className="folio-contact-send-icon" aria-hidden="true">
              <svg className="folio-contact-send-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 18 18 6M6 6h12v12" /></svg>
              {state === "success" && <svg className="folio-contact-send-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>}
            </span>
          </button>
          <p className="folio-contact-feedback" data-state={state} role="status" aria-live="polite" aria-atomic="true">{feedback || <>Prefer email? <a href={`mailto:${profile.email}`}>Write directly ↗</a></>}</p>
        </div>
      </form>
    </div>
  </section>;
}
