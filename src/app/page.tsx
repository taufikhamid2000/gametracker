import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/get-dictionary";

export default async function Home() {
  const { t: dict } = await getDictionary();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center animate-page-in">
      <h1 className="mb-4 text-4xl font-bold text-foreground">{dict.home.title}</h1>
      <p className="mb-8 text-lg text-foreground/60">{dict.home.subtitle}</p>

      <div className="flex gap-4">
        <Link href="/auth/signin">
          <Button variant="outline" size="lg">
            {dict.home.signIn}
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button variant="primary" size="lg">
            {dict.home.signUp}
          </Button>
        </Link>
      </div>

      <div className="mt-16 w-full max-w-2xl rounded-2xl border border-border bg-muted/40 p-6">
        <h2 className="mb-4 text-sm font-medium text-foreground/60">{dict.home.featuresTitle}</h2>
        <ul className="flex flex-col gap-2 text-left">
          <li className="flex items-center gap-2 text-foreground">
            <span className="rounded-full bg-accent/15 p-1 text-accent">✓</span>
            <span>{dict.home.feature1}</span>
          </li>
          <li className="flex items-center gap-2 text-foreground">
            <span className="rounded-full bg-accent/15 p-1 text-accent">✓</span>
            <span>{dict.home.feature2}</span>
          </li>
          <li className="flex items-center gap-2 text-foreground">
            <span className="rounded-full bg-accent/15 p-1 text-accent">✓</span>
            <span>{dict.home.feature3}</span>
          </li>
          <li className="flex items-center gap-2 text-foreground">
            <span className="rounded-full bg-accent/15 p-1 text-accent">✓</span>
            <span>{dict.home.feature4}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
