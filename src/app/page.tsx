import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang, t } from "@/lib/i18n";
import LoginForm from "@/components/LoginForm";
import LangToggle from "@/components/LangToggle";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/matches");

  const lang = getLang();
  const tr = t(lang);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8">
      <div className="mb-8 flex items-center justify-between">
        <span className="text-2xl">⚽️</span>
        <LangToggle current={lang} variant="onLight" />
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-3xl font-bold text-pitch-deep">{tr.appName}</h1>
        <p className="mt-1 mb-8 text-muted">{tr.tagline}</p>

        <LoginForm
          lang={lang}
          labels={{
            enterName: tr.enterName,
            namePlaceholder: tr.namePlaceholder,
            enterPin: tr.enterPin,
            login: tr.login,
            loginHint: tr.loginHint,
            wrongPin: tr.wrongPin,
            badName: tr.badName,
            badPin: tr.badPin
          }}
        />
      </div>
    </main>
  );
}
