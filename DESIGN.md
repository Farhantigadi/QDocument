# Haven — Design System

Complete reference for colors, typography, spacing, components, and visual patterns used across the app.

---

## Typography

### Font Families

| Role | Font | Fallback | Usage |
|---|---|---|---|
| `--font-sans` | Plus Jakarta Sans | Inter, system-ui | Body text, UI labels, inputs |
| `--font-display` | Outfit | Plus Jakarta Sans | Page headings, card titles, hero text |
| `--font-mono` | DM Mono | monospace | OTP codes, passwords, eyebrow labels |

### Weights loaded
- Plus Jakarta Sans: 400, 500, 600, 700, 800
- Outfit: 500, 600, 700, 800
- Inter: 400, 500, 600, 700
- DM Mono: 400, 500

### Text utility classes

| Class | Font | Size | Weight | Letter spacing | Usage |
|---|---|---|---|---|---|
| `.display-title` | Outfit | inherited | 700 | -0.025em | Page titles, card headings |
| `.eyebrow-text` | DM Mono | 11px | 600 | +0.1em uppercase | Section labels above headings |

### Scale (Tailwind defaults)
```
text-xs   → 12px
text-sm   → 14px
text-base → 16px
text-xl   → 20px
text-2xl  → 24px
text-3xl  → 30px
text-4xl  → 36px
text-5xl  → 48px
```

---

## Color System

The palette follows a **60-30-10 rule**:
- **60%** — Background canvas
- **30%** — Surface / card layer
- **10%** — Royal Blue accent / primary action

Colors are defined as HSL CSS variables and consumed via Tailwind.

---

### Light Theme — "Warm Milk White"

| Token | HSL | Hex approx | Role |
|---|---|---|---|
| `--background` | `40 20% 96%` | `#F5F3EF` | Page canvas (warm off-white) |
| `--foreground` | `224 45% 12%` | `#0F1729` | Primary text |
| `--card` | `40 30% 99%` | `#FDFCFA` | Card / surface background |
| `--card-foreground` | `224 45% 12%` | `#0F1729` | Text on cards |
| `--card-border` | `40 15% 88%` | `#E3DDD5` | Card border |
| `--border` | `40 15% 87%` | `#E1DBD3` | General borders |
| `--input` | `40 15% 86%` | `#DFD9D1` | Input borders |
| `--muted` | `40 20% 92%` | `#EAE6E0` | Muted backgrounds |
| `--muted-foreground` | `220 12% 45%` | `#6B7280` | Placeholder / secondary text |
| `--primary` | `217 89% 54%` | `#1A73E8` | Royal Blue — buttons, links |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | Text on primary |
| `--secondary` | `40 20% 92%` | `#EAE6E0` | Secondary button bg |
| `--secondary-foreground` | `224 45% 12%` | `#0F1729` | Text on secondary |
| `--accent` | `217 89% 54%` | `#1A73E8` | Same as primary |
| `--accent-foreground` | `0 0% 100%` | `#FFFFFF` | Text on accent |
| `--destructive` | `354 84% 57%` | `#E53935` | Error / delete red |
| `--destructive-foreground` | `0 0% 100%` | `#FFFFFF` | Text on destructive |
| `--ring` | `217 89% 54%` | `#1A73E8` | Focus ring |

#### Sidebar (Light)
| Token | HSL | Role |
|---|---|---|
| `--sidebar` | `40 25% 94%` | Sidebar background |
| `--sidebar-border` | `40 15% 87%` | Sidebar border |
| `--sidebar-primary` | `217 89% 54%` | Active nav item |
| `--sidebar-accent` | `40 20% 89%` | Hover state |

---

### Dark Theme — "Midnight Slate"

| Token | HSL | Hex approx | Role |
|---|---|---|---|
| `--background` | `224 45% 6%` | `#080D1A` | Deep navy canvas |
| `--foreground` | `210 40% 98%` | `#F5F9FF` | Primary text |
| `--card` | `224 35% 10%` | `#111827` | Card surface |
| `--card-border` | `224 20% 17%` | `#1E2A3D` | Card border |
| `--border` | `224 20% 17%` | `#1E2A3D` | General borders |
| `--input` | `224 20% 19%` | `#212E42` | Input borders |
| `--muted` | `224 25% 14%` | `#161F30` | Muted backgrounds |
| `--muted-foreground` | `215 18% 66%` | `#94A3B8` | Secondary text |
| `--primary` | `217 91% 60%` | `#4285F4` | Brighter blue for dark |
| `--primary-foreground` | `224 45% 6%` | `#080D1A` | Text on primary |
| `--secondary` | `224 25% 14%` | `#161F30` | Secondary bg |
| `--destructive` | `354 84% 63%` | `#EF5350` | Error red (lighter for dark) |

#### Sidebar (Dark)
| Token | HSL | Role |
|---|---|---|
| `--sidebar` | `226 60% 4%` | `#050A14` — deepest dark |
| `--sidebar-primary` | `217 91% 60%` | Active nav item |
| `--sidebar-accent` | `224 20% 13%` | Hover state |

---

### Semantic color usage

| Situation | Token | Example |
|---|---|---|
| Primary action button | `bg-primary text-primary-foreground` | Sign in, Save |
| Destructive action | `bg-destructive text-destructive-foreground` | Delete |
| Error message | `bg-destructive/10 text-destructive` | Form error |
| Success / encrypted badge | `text-emerald-500` | AES-256-GCM label |
| Disabled / placeholder | `text-muted-foreground` | Input placeholder |
| Page background | `bg-background` | `<body>` |
| Card surface | `bg-card border-card-border` | All cards |

---

## Spacing & Sizing

Base font size: **16px**

### Border radius

| Token | Value | Usage |
|---|---|---|
| `--radius` | `1.25rem` (20px) | Base radius |
| `--radius-sm` | `calc(radius - 4px)` = 16px | Small elements |
| `--radius-md` | `calc(radius - 2px)` = 18px | Medium elements |
| `--radius-lg` | `1.25rem` = 20px | Cards, modals |
| `--radius-xl` | `calc(radius + 6px)` = 26px | Large panels |
| `--radius-2xl` | `calc(radius + 12px)` = 32px | Login card, hero panels |

In practice:
- `rounded-xl` (12px) — buttons, inputs, badges
- `rounded-2xl` (16px) — cards, dialogs
- `rounded-[2rem]` (32px) — login page outer card

### Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 2px 6px rgb(15 23 42 / 0.04)` | Default card elevation |
| `--shadow-md` | `0 8px 24px -4px rgb(15 23 42 / 0.08)` | Hover card elevation |
| `--shadow-lg` | `0 20px 40px -6px rgb(15 23 42 / 0.12)` | Modals, login card |
| `--shadow-glow` | `0 0 24px -2px rgba(26,115,232,0.3)` | Blue glow on focus/active |

Dark theme shadows are significantly stronger (0.35–0.65 opacity).

---

## Component Reference

### Button

Variants:

| Variant | Background | Text | Use case |
|---|---|---|---|
| `default` | `bg-primary` | `text-primary-foreground` | Primary CTA |
| `accent` | `bg-accent` | `text-accent-foreground` | Highlighted action |
| `destructive` | `bg-destructive` | white | Delete, danger |
| `outline` | `bg-card` + border | `text-foreground` | Secondary action |
| `secondary` | `bg-secondary` | `text-secondary-foreground` | Tertiary action |
| `ghost` | transparent | `text-foreground` | Icon buttons, nav |
| `link` | none | `text-accent` underline | Inline links |

Sizes:

| Size | Min height | Padding | Radius |
|---|---|---|---|
| `default` | 44px | px-5 py-2.5 | rounded-xl |
| `sm` | 36px | px-3.5 | rounded-lg |
| `lg` | 48px | px-7 | rounded-xl |
| `icon` | 44×44px | none | rounded-xl |
| `icon-sm` | 36×36px | none | rounded-lg |

All buttons: `active:scale-[0.98]`, `transition-all duration-200`, `font-semibold text-sm`

---

### Input

- Height: min 44px
- Border: `border-input` → `rounded-xl`
- Background: `bg-card`
- Focus: `ring-2 ring-ring border-transparent`
- Placeholder: `text-muted-foreground/70`
- Font: `text-base` (mobile) / `text-sm` (md+)

---

### Card

- Background: `bg-card`
- Border: `border border-card-border`
- Radius: `rounded-2xl`
- Shadow: `shadow-sm`
- Transition: `transition-all duration-200`

Sub-components: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- Padding: `p-5 sm:p-6`
- Title uses `.display-title` class (Outfit font)

---

### Vault Card (`.vault-card-surface`)

Custom class for password vault credential cards:
- Background: `hsl(var(--card))`
- Border: `1px solid hsl(var(--card-border))`
- Shadow: `var(--shadow-sm)`
- Radius: `1.25rem`
- Hover: shadow upgrades to `--shadow-md`, border tints to `primary/40`
- Transition: `200ms cubic-bezier(0.16, 1, 0.3, 1)`

---

### Badge

Variants: `default` (blue), `secondary` (muted), `destructive` (red), `outline` (bordered)
- Radius: `rounded-md`
- Size: `px-2.5 py-0.5 text-xs font-semibold`
- Never wraps: `whitespace-nowrap`

---

## Animation

### `.animate-fade-in`
Applied to page-level containers on mount:
```css
@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.97) translateY(8px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);   }
}
animation: fadeInScale 260ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
```

### Transition standard
- Interactive elements: `transition-all duration-200`
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (spring-like, fast settle)

---

## Layout patterns

### Login page
- Full viewport: `min-h-[100dvh]` flex centered
- Two-column card: `md:grid-cols-[.9fr_1.1fr]`
- Left panel: `bg-primary text-primary-foreground` with decorative circles
- Right panel: form area with `p-7 sm:p-12 lg:p-16`
- Outer card radius: `rounded-[2rem]`

### App pages (authenticated)
- Max width: `max-w-[1400px]`
- Padding: `px-4 py-6 sm:px-8 lg:px-10 lg:py-10`
- All pages wrapped in `.animate-fade-in`

### Credential grid
- `grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`

---

## Component library

Built on **shadcn/ui** (New York style) with Radix UI primitives:

- Dialog, AlertDialog, DropdownMenu, Popover, Tooltip
- Select, Checkbox, Switch, RadioGroup, Slider
- Tabs, Accordion, Collapsible
- Table, Pagination
- Sidebar (full collapsible sidebar system)
- Sonner (toast notifications)
- InputOTP (6-digit OTP input)
- Skeleton (loading states)
- Progress, Spinner

Config: `components.json` — style: `new-york`, baseColor: `neutral`, cssVariables: `true`
