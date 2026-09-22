"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  submitContactMessage,
  type ContactActionState,
} from "@/features/contact/contact-actions";

const initialState: ContactActionState = { status: "idle", message: "" };

function FieldError({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.length) return null;

  return (
    <p className="mt-2 text-sm text-red-200" id={id}>
      {errors[0]}
    </p>
  );
}

const inputClassName =
  "mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-[#080808] px-4 text-white outline-none transition placeholder:text-white/30 focus:border-[#ffb800]/70 focus:ring-3 focus:ring-[#ffb800]/20 disabled:opacity-60";

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    submitContactMessage,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <form
      action={formAction}
      className="rounded-[1.75rem] border border-white/10 bg-[#101010]/95 p-6 shadow-[0_2rem_6rem_rgb(0_0_0/0.24)] sm:p-8"
      ref={formRef}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold text-white/75">
          Name
          <input
            aria-describedby={state.fieldErrors?.name ? "contact-name-error" : undefined}
            className={inputClassName}
            disabled={pending}
            maxLength={160}
            name="name"
            required
            type="text"
          />
          <FieldError errors={state.fieldErrors?.name} id="contact-name-error" />
        </label>
        <label className="text-sm font-semibold text-white/75">
          Email
          <input
            aria-describedby={state.fieldErrors?.email ? "contact-email-error" : undefined}
            autoComplete="email"
            className={inputClassName}
            disabled={pending}
            maxLength={320}
            name="email"
            required
            type="email"
          />
          <FieldError errors={state.fieldErrors?.email} id="contact-email-error" />
        </label>
      </div>

      <label className="mt-5 block text-sm font-semibold text-white/75">
        Subject
        <input
          aria-describedby={state.fieldErrors?.subject ? "contact-subject-error" : undefined}
          className={inputClassName}
          disabled={pending}
          maxLength={240}
          name="subject"
          required
          type="text"
        />
        <FieldError errors={state.fieldErrors?.subject} id="contact-subject-error" />
      </label>

      <label className="mt-5 block text-sm font-semibold text-white/75">
        Message
        <textarea
          aria-describedby={state.fieldErrors?.message ? "contact-message-error" : undefined}
          className={`${inputClassName} min-h-40 resize-y py-3`}
          disabled={pending}
          maxLength={5_000}
          name="message"
          required
        />
        <FieldError errors={state.fieldErrors?.message} id="contact-message-error" />
      </label>

      <label
        aria-hidden="true"
        className="absolute -left-[10000px] top-auto size-px overflow-hidden"
      >
        Website
        <input autoComplete="off" name="website" tabIndex={-1} type="text" />
      </label>

      {state.message ? (
        <p
          className={`mt-5 rounded-xl border px-4 py-3 text-sm leading-6 ${
            state.status === "success"
              ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
              : "border-red-400/25 bg-red-400/10 text-red-100"
          }`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <button
        className="mt-6 min-h-12 cursor-pointer rounded-full bg-[#ffb800] px-6 text-sm font-bold text-[#080808] transition hover:bg-[#ffc83d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ffb800]/40 disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
