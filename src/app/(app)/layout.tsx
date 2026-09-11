import { AppShell } from "@/components/layout/app-shell";
import { getDictionary } from "@/lib/get-dictionary";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getDictionary();

  return <AppShell nav={t.nav}>{children}</AppShell>;
}
