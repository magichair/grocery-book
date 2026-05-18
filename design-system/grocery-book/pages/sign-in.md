# Page Override: Sign-in (`/sign-in`, `/sign-in/check-email`)

> Overrides: MASTER.md  
> No bottom nav. No top header. Full-screen centred layout.

## Layout

Full viewport, centred column, max-w-sm, px-6. Off-white background (`bg-slate-50`).

## `/sign-in`

```
┌──────────────────────────┐
│                          │  ← bg-slate-50
│                          │
│    [App wordmark/logo]   │  ← text-2xl font-bold text-brand
│                          │
│  "Know the best price    │  ← text-slate-500 text-sm, max-w-[260px] mx-auto
│   before you buy."       │
│                          │
│  ┌────────────────────┐  │
│  │ Email address      │  │  ← standard input, inputMode="email", autofocus
│  └────────────────────┘  │
│                          │
│  [Send sign-in link]     │  ← full-width, bg-brand, text-white, py-3, rounded-xl
│                          │
└──────────────────────────┘
```

- No social login buttons. No password field. No "forgot password".
- Button shows loading spinner (`animate-spin`) and is disabled during submit.
- Error state: red helper text below input, input gets `border-red-400 focus:ring-red-200`.

## `/sign-in/check-email`

```
┌──────────────────────────┐
│                          │
│    [EnvelopeIcon]        │  ← w-12 h-12 text-brand mx-auto
│                          │
│  Check your inbox        │  ← text-xl font-semibold
│  We sent a link to       │  ← text-sm text-slate-500
│  {email}                 │  ← text-sm font-medium text-slate-900
│                          │
│  [Resend] (after 60s)    │  ← text button, text-brand, disabled until timer
│   00:42 remaining        │  ← text-[13px] text-slate-400 countdown
│                          │
└──────────────────────────┘
```

- No back button.
- The email address is displayed in full so users can verify they typed it correctly.
