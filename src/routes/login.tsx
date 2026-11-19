import { createFileRoute } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { MobileShell } from "@/components/speakup/MobileShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  clearLocalProfile,
  saveLocalProfile,
  useLocalProfile,
  type Profile,
} from "@/hooks/use-local-profile";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Local profile — Speak Sprout" }] }),
  component: LocalProfile,
});

function LocalProfile() {
  const profile = useLocalProfile();
  const [draft, setDraft] = useState<Profile | null>(null);
  const [status, setStatus] = useState("");
  const nameInput = useRef<HTMLInputElement>(null);
  const fields = draft ?? profile ?? { name: "", email: "" };

  function updateField(field: keyof Profile, value: string) {
    setDraft({ ...fields, [field]: value });
    setStatus("");
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fields.name.trim()) return;
    if (saveLocalProfile(fields)) {
      setDraft(null);
      setStatus("Profile saved.");
    } else {
      setStatus("Couldn’t save the profile in this browser.");
    }
  }

  function clear() {
    if (clearLocalProfile()) {
      setDraft(null);
      setStatus("Local profile cleared.");
      nameInput.current?.focus();
    } else {
      setStatus("Couldn’t clear the profile in this browser.");
    }
  }

  return (
    <MobileShell>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Local profile</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your profile and practice history stay in this browser.
      </p>
      <form
        onSubmit={save}
        className="mt-6 max-w-lg space-y-4 rounded-[1.5rem] border border-border bg-card p-5 sm:p-6"
      >
        <span className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
          <UserRound aria-hidden="true" className="size-6" />
        </span>
        <div>
          <label htmlFor="profile-name" className="text-sm font-bold">
            Name
          </label>
          <Input
            id="profile-name"
            ref={nameInput}
            className="mt-1"
            autoComplete="name"
            maxLength={80}
            required
            value={fields.name}
            onChange={(event) => updateField("name", event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="profile-email" className="text-sm font-bold">
            Email <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="profile-email"
            className="mt-1"
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="hero" size="pill" disabled={!fields.name.trim()}>
            Save profile
          </Button>
          {profile && (
            <Button type="button" variant="soft" size="pill" onClick={clear}>
              Clear local profile
            </Button>
          )}
        </div>
        <p role="status" className={status ? "text-sm text-muted-foreground" : "sr-only"}>
          {status}
        </p>
      </form>
    </MobileShell>
  );
}
