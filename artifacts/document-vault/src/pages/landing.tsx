import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { FileText, KeyRound, Lock, ShieldCheck, Smartphone, Eye, FolderOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      {children}
    </div>
  );
}

const features = [
  {
    icon: FolderOpen,
    title: 'Document Vault',
    desc: 'Store passports, insurance policies, leases, certificates — anything important. Link Google Drive files or upload directly.',
  },
  {
    icon: KeyRound,
    title: 'Password Manager',
    desc: 'Save website logins and credentials. Passwords are locked away and only revealed when you ask for them.',
  },
  {
    icon: Lock,
    title: 'Military-Grade Encryption',
    desc: 'Every password is scrambled using AES-256-GCM — the same standard banks and governments use. Even we cannot read your data.',
  },
  {
    icon: Eye,
    title: 'Reveal on Demand',
    desc: 'Passwords stay hidden by default. Tap the eye icon to reveal a password only when you need it.',
  },
  {
    icon: Smartphone,
    title: 'Works on Any Device',
    desc: 'Designed mobile-first. Access your vault from your phone, tablet, or desktop — it looks great everywhere.',
  },
  {
    icon: ShieldCheck,
    title: 'Email Verification',
    desc: 'Every new account is verified with a one-time code sent to your email. No unverified accounts are ever stored.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/60 bg-background/90 px-5 backdrop-blur-md sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <KeyRound className="h-4 w-4" />
          </span>
          <span className="display-title text-xl font-extrabold">Haven</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login">
            <Button size="sm" className="rounded-xl">Sign in</Button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-3xl px-5 pb-16 pt-16 text-center sm:pt-24 sm:pb-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          AES-256-GCM Encrypted · Free to use
        </div>

        <h1 className="display-title mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Everything important,<br />
          <span className="text-primary">in one quiet place.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Haven is your private vault for documents and passwords. Store them securely, find them instantly, and never worry about losing something important again.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/login">
            <Button size="lg" className="w-full rounded-xl sm:w-auto">
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full rounded-xl sm:w-auto">
              Sign in to your vault
            </Button>
          </Link>
        </div>

        {/* Social proof strip */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Bank-level encryption</span>
          <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-primary" /> Passwords never stored in plain text</span>
          <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-primary" /> Documents + credentials in one place</span>
        </div>
      </section>

      {/* ── What is AES-256? ── */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
          <FadeIn>
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Lock className="h-8 w-8" />
              </div>
              <div>
                <p className="eyebrow-text text-emerald-500">What does "AES-256 Protected" mean?</p>
                <h2 className="display-title mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                  Your passwords are scrambled — permanently.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  AES-256 is an encryption standard used by banks, governments, and the military. When you save a password in Haven, it is instantly scrambled into unreadable code before it ever touches our database. Even if someone broke into our servers, they would see nothing but gibberish. Only you — with your active session — can unscramble and read your passwords.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Think of it like a safe deposit box where only your key works — and we never hold a copy of your key.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <FadeIn>
          <div className="text-center">
            <p className="eyebrow-text text-primary">Everything you need</p>
            <h2 className="display-title mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">
              Built for real life, not just tech people.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Haven is designed so anyone can use it — no technical knowledge required.
            </p>
          </div>
        </FadeIn>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 60}>
              <div className="vault-card-surface flex flex-col gap-3 rounded-2xl p-5 h-full">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="display-title text-base font-bold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
          <FadeIn>
            <div className="text-center">
              <p className="eyebrow-text text-primary">Simple by design</p>
              <h2 className="display-title mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">
                Up and running in 3 steps.
              </h2>
            </div>
          </FadeIn>

          <div className="mt-10 space-y-6">
            {[
              { step: '01', title: 'Create your account', desc: 'Sign up with your email. We send a one-time code to verify it\'s really you — no unverified accounts are ever saved.' },
              { step: '02', title: 'Add your documents & passwords', desc: 'Paste a Google Drive link, upload a file, or type in a password. Haven organises everything automatically.' },
              { step: '03', title: 'Access from anywhere', desc: 'Open Haven on your phone or computer. Your vault is always there, always encrypted, always private.' },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 80}>
                <div className="flex gap-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-mono text-sm font-bold shadow-sm">
                    {item.step}
                  </div>
                  <div className="pt-1">
                    <h3 className="display-title text-base font-bold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-2xl px-5 py-16 text-center sm:py-24">
        <FadeIn>
          <h2 className="display-title text-3xl font-extrabold text-foreground sm:text-4xl">
            Ready to secure your life?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Join Haven and keep your most important documents and passwords safe, organised, and always within reach.
          </p>
          <Link href="/login">
            <Button size="lg" className="mt-7 rounded-xl px-8">
              Create your free vault <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </FadeIn>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-5 py-8 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <KeyRound className="h-3.5 w-3.5" />
          <span className="font-semibold">Haven</span>
        </div>
        <p>Your documents and passwords, encrypted and private.</p>
        <p className="mt-1 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-emerald-500" /> AES-256-GCM encrypted · Sessions are HttpOnly and secure
        </p>
      </footer>

    </div>
  );
}
