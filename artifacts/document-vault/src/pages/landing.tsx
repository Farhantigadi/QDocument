import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

/* Reads dark mode from <html> class and re-renders on change */
function useDark() {
  const [dk, setDk] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDk(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dk;
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setOn(true); },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, on };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, on } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: '800ms',
        transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
        transitionProperty: 'opacity, transform',
        opacity: on ? 1 : 0,
        transform: on ? 'none' : 'translateY(20px)',
      }}
    >
      {children}
    </div>
  );
}

const IMG_HERO    = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=85&auto=format&fit=crop';
const IMG_FEATURE = 'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=1200&q=80&auto=format&fit=crop';
const IMG_MOBILE  = 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=900&q=80&auto=format&fit=crop';

export default function Landing() {
  const dk = useDark();

  const bg       = dk ? '#0a0a0a' : '#ffffff';
  const bgAlt    = dk ? '#111111' : '#f5f5f7';
  const fg       = dk ? '#f5f5f7' : '#1d1d1f';
  const fgMuted  = dk ? '#86868b' : '#6e6e73';
  const fgDim    = dk ? '#48484a' : '#aeaeb2';
  const border   = dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const navBg    = dk ? 'rgba(10,10,10,0.75)' : 'rgba(255,255,255,0.75)';
  const pillBg   = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const pillBorder = dk ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  const btnPrimBg  = dk ? '#f5f5f7' : '#1d1d1f';
  const btnPrimFg  = dk ? '#0a0a0a' : '#ffffff';
  const btnSecBg   = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const btnSecFg   = dk ? '#f5f5f7' : '#1d1d1f';
  const gridLine   = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const cardBg     = dk ? '#111111' : '#ffffff';
  const tagBg      = dk ? 'rgba(255,255,255,0.06)' : '#ffffff';
  const heroImgOp  = dk ? 0.06 : 0.07;
  const heroGrad   = dk
    ? 'linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgba(10,10,10,0.6) 60%, #0a0a0a 100%)'
    : 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 60%, #ffffff 100%)';
  const featGrad = dk
    ? 'linear-gradient(to right, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.5) 55%, rgba(10,10,10,0) 100%)'
    : 'linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 55%, rgba(255,255,255,0) 100%)';
  const mobGrad = dk
    ? 'linear-gradient(to left, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.5) 55%, rgba(10,10,10,0) 100%)'
    : 'linear-gradient(to left, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 55%, rgba(255,255,255,0) 100%)';

  const F = { fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' };

  return (
    <div style={{ ...F, background: bg, color: fg, minHeight: '100dvh', overflowX: 'hidden' }}>

      {/* ── NAV: floating rounded pill, blur, gap from top ── */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '14px 20px' }}>
        <div style={{
          maxWidth: 960,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
          padding: '0 20px',
          borderRadius: 18,
          border: `1px solid ${border}`,
          background: navBg,
          backdropFilter: 'saturate(180%) blur(24px)',
          WebkitBackdropFilter: 'saturate(180%) blur(24px)',
          boxShadow: dk
            ? '0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset'
            : '0 8px 32px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.8) inset',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 9, background: fg }}>
              <KeyRound style={{ width: 14, height: 14, color: bg }} />
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', color: fg }}>Haven</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ThemeToggle />
            <Link href="/login">
              <span style={{ fontSize: 13, fontWeight: 400, color: fgMuted, cursor: 'pointer', letterSpacing: '-0.01em', padding: '6px 12px', borderRadius: 10, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = fg)}
                onMouseLeave={e => (e.currentTarget.style.color = fgMuted)}>
                Sign in
              </span>
            </Link>
            <Link href="/login">
              <span style={{ fontSize: 13, fontWeight: 500, color: btnPrimFg, background: btnPrimBg, cursor: 'pointer', letterSpacing: '-0.01em', padding: '7px 16px', borderRadius: 10, transition: 'opacity 0.2s', display: 'inline-block' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                Get started
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '84px 20px 60px' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img src={IMG_HERO} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: heroImgOp, filter: 'grayscale(100%)' }} />
          {/* grid pattern */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `linear-gradient(${dk ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.10)'} 1px, transparent 1px), linear-gradient(90deg, ${dk ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.10)'} 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black 0%, black 40%, transparent 100%)',
          }} />
          <div style={{ position: 'absolute', inset: 0, background: heroGrad }} />
        </div>

        <div style={{ position: 'relative', zIndex: 10, maxWidth: 680, textAlign: 'center' }}>
          <div className="landing-fade-up" style={{ animationDelay: '0ms', marginBottom: 28 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, border: `1px solid ${pillBorder}`, background: pillBg, padding: '5px 14px', fontSize: 12, fontWeight: 500, color: fgMuted, letterSpacing: '-0.01em' }}>
              <ShieldCheck style={{ width: 12, height: 12, color: fg }} />
              AES-256-GCM encrypted
            </span>
          </div>

          <h1 className="landing-fade-up" style={{ animationDelay: '80ms', fontSize: 'clamp(40px, 7vw, 78px)', fontWeight: 700, lineHeight: 1.04, letterSpacing: '-0.04em', color: fg, margin: 0 }}>
            Your private vault<br />
            <span style={{ color: fgMuted, fontWeight: 300, fontStyle: 'italic' }}>for everything that matters.</span>
          </h1>

          <p className="landing-fade-up" style={{ animationDelay: '160ms', marginTop: 24, fontSize: 17, fontWeight: 400, lineHeight: 1.6, color: fgMuted, letterSpacing: '-0.01em', maxWidth: 460, margin: '24px auto 0' }}>
            Documents. Passwords. Certificates. All encrypted, all private, all in one place.
          </p>

          <div className="landing-fade-up" style={{ animationDelay: '240ms', marginTop: 36, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Link href="/login">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 999, padding: '13px 28px', fontSize: 15, fontWeight: 500, color: btnPrimFg, background: btnPrimBg, cursor: 'pointer', letterSpacing: '-0.01em', transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.82')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                Create your vault <ArrowRight style={{ width: 15, height: 15 }} />
              </span>
            </Link>
            <Link href="/login">
              <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, border: `1px solid ${pillBorder}`, background: btnSecBg, padding: '13px 28px', fontSize: 15, fontWeight: 500, color: btnSecFg, cursor: 'pointer', letterSpacing: '-0.01em', transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                Sign in
              </span>
            </Link>
          </div>

          <p className="landing-fade-up" style={{ animationDelay: '320ms', marginTop: 22, fontSize: 12, color: fgDim, letterSpacing: '-0.01em' }}>
            Free forever · No credit card · Zero plain-text storage
          </p>
        </div>

        <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)' }} className="pulse-slow">
          <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, ${fgDim}, transparent)` }} />
        </div>
      </section>

      {/* ── STATEMENT ── */}
      <section style={{ borderTop: `1px solid ${border}`, padding: '96px 20px' }}>
        <Reveal>
          <p style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center', fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 300, lineHeight: 1.2, letterSpacing: '-0.03em', color: fg }}>
            Most people store passwords in notes apps and documents in email threads.{' '}
            <span style={{ fontWeight: 600 }}>Haven fixes that.</span>
          </p>
        </Reveal>
      </section>

      {/* ── FEATURE IMAGE ── */}
      <section style={{ position: 'relative', overflow: 'hidden', height: 'clamp(300px, 48vw, 580px)', borderTop: `1px solid ${border}` }}>
        <img src={IMG_FEATURE} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(20%)', opacity: dk ? 0.5 : 0.88 }} />
        <div style={{ position: 'absolute', inset: 0, background: featGrad }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
          <Reveal>
            <div style={{ maxWidth: 400, padding: '0 40px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: fgMuted }}>Security</p>
              <h2 style={{ marginTop: 12, fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.08, color: fg }}>
                Encrypted before it leaves your device.
              </h2>
              <p style={{ marginTop: 14, fontSize: 15, lineHeight: 1.7, color: fgMuted, fontWeight: 400 }}>
                AES-256-GCM. The same standard used by banks and governments. Even we cannot read your passwords.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOUR PILLARS ── */}
      <section style={{ borderTop: `1px solid ${border}`, padding: '96px 20px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Reveal>
            <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: fgMuted, marginBottom: 56 }}>
              Built for complete digital control
            </p>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 1, background: gridLine, borderRadius: 20, overflow: 'hidden' }}>
            {[
              { n: '01', title: 'Document Vault', body: 'Passports, leases, tax forms, insurance. Link Google Drive files or paste any URL. Categorised automatically, retrieved in seconds.' },
              { n: '02', title: 'Password Manager', body: 'Store account credentials with AES-256 encryption. Passwords remain hidden by default — revealed only on your command.' },
              { n: '03', title: 'Revocable Share Links', body: 'Send temporary access links to landlords, banks, or family. Set optional expiry timers or cut off access instantly in one tap.' },
              { n: '04', title: 'Zero-Knowledge Security', body: 'Your vault is scrambled locally with session-derived keys. We store ciphertext — your files remain completely unreadable to anyone else.' },
            ].map((p, i) => (
              <Reveal key={p.n} delay={i * 80}>
                <div style={{ background: cardBg, padding: '32px 28px 36px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: fgDim, letterSpacing: '0.06em' }}>{p.n}</span>
                  <div style={{ marginTop: 40 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.025em', color: fg, lineHeight: 1.25 }}>{p.title}</h3>
                    <p style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.65, color: fgMuted }}>{p.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SHARE LINKS SPOTLIGHT (UNIQUE FEATURE) ── */}
      <section style={{ borderTop: `1px solid ${border}`, padding: '96px 20px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 56, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'center' }}>
          <Reveal>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, border: `1px solid ${pillBorder}`, background: tagBg, padding: '4px 12px', fontSize: 11, fontWeight: 600, color: fg, letterSpacing: '-0.01em', marginBottom: 16 }}>
              <span>Unique Feature</span> · <span>Temporary Share Links</span>
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.08, color: fg }}>
              Share documents on your terms. Revoke access anytime.
            </h2>
            <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.75, color: fgMuted }}>
              Stop emailing sensitive PDF attachments that sit in external inboxes forever. With Haven, you create clean, self-destructing share links with custom expiration timers.
            </p>
            <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.75, color: fgMuted }}>
              When the transaction is done, hit <strong>Revoke</strong> — the link instantly invalidates, and recipients get a clean "Access Revoked" notice.
            </p>
            <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: fg, fontWeight: 500 }}>
                <ShieldCheck style={{ width: 16, height: 16 }} /> One-tap revocation
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: fg, fontWeight: 500 }}>
                <Lock style={{ width: 16, height: 16 }} /> Expiry countdowns
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div style={{ borderRadius: 18, border: `1px solid ${border}`, background: cardBg, padding: '24px', boxShadow: dk ? '0 12px 32px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${border}`, paddingBottom: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: fg }}>Active Share Link</span>
                </div>
                <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: fgMuted }}>haven.app/s/a8f3b2…</span>
              </div>
              <div className="space-y-3">
                <div style={{ background: bgAlt, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: fg }}>Apartment_Lease_2026.pdf</p>
                    <p style={{ fontSize: 11, color: fgMuted, marginTop: 2 }}>Shared with Landlord · Expires in 3 days</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#ff5f57', background: 'rgba(255,95,87,0.1)', padding: '4px 10px', borderRadius: 8, cursor: 'default' }}>Revoke link</span>
                </div>
                <div style={{ marginTop: 12, background: 'rgba(255,95,87,0.06)', border: '1px solid rgba(255,95,87,0.2)', borderRadius: 12, padding: '12px 14px' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#ff5f57' }}>When revoked by owner:</p>
                  <p style={{ fontSize: 11, color: fgMuted, marginTop: 2 }}>Recipient sees: "Access Revoked — This link was ended by the owner."</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── ENCRYPTION EXPLAINER ── */}
      <section style={{ borderTop: `1px solid ${border}`, background: bgAlt, padding: '96px 20px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 56, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}>
          <Reveal>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: fgMuted }}>How it works</p>
            <h2 style={{ marginTop: 14, fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1, color: fg }}>
              What "AES-256 Protected" actually means.
            </h2>
            <p style={{ marginTop: 18, fontSize: 15, lineHeight: 1.8, color: fgMuted }}>
              When you save a password, Haven scrambles it into unreadable ciphertext before it ever reaches our database. The scrambling key lives only in your active session - not on our servers.
            </p>
            <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.8, color: fgMuted }}>
              Think of it as a safe deposit box where only your key works. We hold the box. We never hold the key.
            </p>
            <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['AES-256-GCM', 'iv · authTag · ciphertext', 'HttpOnly cookie', 'Zero plain-text'].map((t) => (
                <span key={t} style={{ borderRadius: 999, border: `1px solid ${pillBorder}`, background: tagBg, padding: '5px 12px', fontSize: 12, fontWeight: 500, color: fg, letterSpacing: '-0.01em' }}>{t}</span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, background: '#1d1d1f' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '12px 16px' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
                <span style={{ marginLeft: 10, fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'DM Mono, monospace' }}>haven - encryption</span>
              </div>
              <div style={{ padding: '20px 20px 24px', fontFamily: 'DM Mono, monospace', fontSize: 13, lineHeight: 1.7 }}>
                <p style={{ color: 'rgba(255,255,255,0.25)' }}>// what you type</p>
                <p style={{ color: '#ff5f57', marginTop: 4 }}>password = "MySecretPass123!"</p>
                <p style={{ color: 'rgba(255,255,255,0.25)', marginTop: 16 }}>// what Haven stores</p>
                <p style={{ color: '#28c840', marginTop: 4, wordBreak: 'break-all' }}>
                  a3f8c2d1:9f2a1c3e:<span style={{ color: 'rgba(40,200,64,0.5)' }}>7a3f9c2e1d4b8a5f2c9e3d6b1a4f7c0e2d5b8a1f</span>
                </p>
                <p style={{ color: 'rgba(255,255,255,0.25)', marginTop: 16 }}>// what an attacker sees</p>
                <p style={{ color: 'rgba(255,255,255,0.12)', marginTop: 4, userSelect: 'none' }}>{'█'.repeat(28)}</p>
                <div style={{ marginTop: 16, borderRadius: 10, border: '1px solid rgba(40,200,64,0.2)', background: 'rgba(40,200,64,0.07)', padding: '10px 14px' }}>
                  <p style={{ color: '#28c840', fontSize: 12 }}>✓ Unreadable without your session - even to us</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── STEPS ── */}
      <section style={{ borderTop: `1px solid ${border}`, padding: '96px 20px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Reveal>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.035em', color: fg, marginBottom: 56 }}>
              Up and running in minutes.
            </h2>
          </Reveal>
          <div>
            {[
              { n: '1', title: 'Create your account', body: "Sign up with your email. A one-time code confirms it's really you. No unverified accounts are ever stored." },
              { n: '2', title: 'Add your documents and passwords', body: 'Paste a Google Drive link or type in a password. Haven organises everything by category - no manual sorting needed.' },
              { n: '3', title: 'Access from anywhere', body: 'Open Haven on your phone or laptop. Your vault is always there, always encrypted, always yours.' },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 60}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 40, padding: '32px 0', borderTop: i === 0 ? `1px solid ${border}` : undefined, borderBottom: `1px solid ${border}` }}>
                  <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 500, color: fgDim, minWidth: 16, paddingTop: 2 }}>{s.n}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.025em', color: fg }}>{s.title}</h3>
                    <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.7, color: fgMuted }}>{s.body}</p>
                  </div>
                  <Lock style={{ width: 15, height: 15, flexShrink: 0, color: fgDim, marginTop: 3 }} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOBILE IMAGE ── */}
      <section style={{ position: 'relative', overflow: 'hidden', height: 'clamp(280px, 44vw, 540px)', borderTop: `1px solid ${border}` }}>
        <img src={IMG_MOBILE} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(15%)', opacity: dk ? 0.5 : 0.85 }} />
        <div style={{ position: 'absolute', inset: 0, background: mobGrad }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Reveal>
            <div style={{ maxWidth: 360, padding: '0 40px', textAlign: 'right' }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: fgMuted }}>Mobile-first</p>
              <h2 style={{ marginTop: 12, fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1, color: fg }}>
                Your vault in your pocket.
              </h2>
              <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: fgMuted }}>
                Designed for your phone first. Large touch targets, bottom navigation, instant access.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ borderTop: `1px solid ${border}`, padding: '112px 20px', textAlign: 'center' }}>
        <Reveal>
          <h2 style={{ fontSize: 'clamp(34px, 5vw, 62px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.04, color: fg }}>
            Everything important.<br />
            <span style={{ fontWeight: 300, fontStyle: 'italic', color: fgMuted }}>Finally in one place.</span>
          </h2>
          <p style={{ maxWidth: 380, margin: '18px auto 0', fontSize: 16, lineHeight: 1.65, color: fgMuted, fontWeight: 400 }}>
            Join Haven and keep your most important documents and passwords safe, organised, and always within reach.
          </p>
          <div style={{ marginTop: 36, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Link href="/login">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 999, padding: '14px 32px', fontSize: 15, fontWeight: 500, color: btnPrimFg, background: btnPrimBg, cursor: 'pointer', letterSpacing: '-0.01em', transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.82')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                Create your free vault <ArrowRight style={{ width: 15, height: 15 }} />
              </span>
            </Link>
            <Link href="/login">
              <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, border: `1px solid ${pillBorder}`, background: btnSecBg, padding: '14px 32px', fontSize: 15, fontWeight: 500, color: btnSecFg, cursor: 'pointer', letterSpacing: '-0.01em', transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                Sign in
              </span>
            </Link>
          </div>
          <p style={{ marginTop: 20, fontSize: 12, color: fgDim, letterSpacing: '-0.01em' }}>
            Free forever · AES-256-GCM encrypted · No credit card
          </p>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${border}`, padding: '28px 20px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 8, background: fg }}>
              <KeyRound style={{ width: 12, height: 12, color: bg }} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: fg, letterSpacing: '-0.01em' }}>Haven</span>
          </div>
          <p style={{ fontSize: 12, color: fgDim, letterSpacing: '-0.01em' }}>
            Your documents and passwords, encrypted and private.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: fgDim }}>
            <ShieldCheck style={{ width: 13, height: 13 }} />
            AES-256-GCM · HttpOnly sessions
          </div>
        </div>
      </footer>

    </div>
  );
}
