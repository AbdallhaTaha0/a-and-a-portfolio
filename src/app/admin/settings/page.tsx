import { AccountSettingsForm } from "@/features/auth/account-settings-form";
import { requireCurrentUser } from "@/server/auth/current-user";
import { getOwnAccountSettings } from "@/server/auth/account-settings";

const dateTime = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AccountSettingsPage() {
  const currentUser = await requireCurrentUser();
  const account = await getOwnAccountSettings(currentUser.id);

  if (!account) {
    return (
      <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-8">
        <h1 className="text-3xl font-bold">Account unavailable</h1>
        <p className="mt-3 text-white/55">Your active account settings could not be loaded.</p>
      </div>
    );
  }

  const providers = [...new Set(account.accounts.map(({ provider }) => provider))];

  return (
    <div className="max-w-4xl">
      <p className="text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">Your account</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Account settings</h1>
      <p className="mt-3 max-w-2xl leading-7 text-white/55">
        Your sign-in identity is managed by Google or GitHub. Local settings cannot change your verified email, role, or account status.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8" aria-labelledby="display-settings-heading">
          <h2 className="text-2xl font-bold" id="display-settings-heading">Display settings</h2>
          <AccountSettingsForm name={account.name} />
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
            <p className="text-xs font-bold tracking-[0.1em] text-white/35 uppercase">Verified identity</p>
            <dl className="mt-5 space-y-4 text-sm">
              <div><dt className="text-white/35">Email</dt><dd className="mt-1 break-all text-white/75">{account.email}</dd></div>
              <div><dt className="text-white/35">Role</dt><dd className="mt-1 text-white/75">{account.role.replace("_", " ")}</dd></div>
              <div><dt className="text-white/35">Sign-in providers</dt><dd className="mt-1 text-white/75">{providers.length ? providers.map((provider) => provider[0]?.toUpperCase() + provider.slice(1)).join(", ") : "No provider connected"}</dd></div>
              {account.lastLoginAt ? <div><dt className="text-white/35">Last sign-in</dt><dd className="mt-1 text-white/75">{dateTime.format(account.lastLoginAt)}</dd></div> : null}
            </dl>
          </div>
          <div className="rounded-3xl border border-[#ffb800]/20 bg-[#ffb800]/5 p-6 text-sm leading-6 text-white/55">
            OAuth credentials and session tokens remain server-side and are never available to this page.
          </div>
        </aside>
      </div>
    </div>
  );
}
