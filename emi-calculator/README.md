# Ledger — EMI & Loan Calculator

A free, no-signup EMI (Equated Monthly Installment) calculator. Enter a loan amount, interest
rate, and term to instantly see your monthly payment, total interest payable, and a full
year-by-year or month-by-month amortization schedule — downloadable as CSV.

Built with plain HTML, CSS, and JavaScript. No build step, no dependencies, no backend.
All calculations run client-side; no data is ever sent anywhere.

## Features

- Standard EMI formula: `EMI = P × r × (1+r)ⁿ / ((1+r)ⁿ − 1)`
- Live updates as you type or drag the sliders
- Years/months toggle for loan term
- 5 currency options (₹ $ € £ A$)
- Optional first-payment date to show real calendar months in the schedule
- Yearly/monthly amortization view toggle
- CSV export of the full month-by-month schedule
- Input validation with inline error messages
- Fully responsive (mobile, tablet, desktop)
- Accessible: visible focus states, semantic labels, `prefers-reduced-motion` respected

## Run locally

No build tools needed. Either:

- Open `index.html` directly in a browser, or
- Serve it locally for a cleaner experience:
  ```bash
  npx serve .
  ```

## Deploy on Vercel (free Hobby plan)

1. Push this folder to a public GitHub repo.
2. Go to [vercel.com](https://vercel.com) → sign in with GitHub (free, no card required).
3. **Add New Project** → import the repo.
4. Framework preset: **Other** (it's static HTML — no build command, no install command needed).
5. Click **Deploy**. Done — you'll get a live `*.vercel.app` URL.

Alternatively, using the Vercel CLI:
```bash
npm i -g vercel
vercel
```

## Before submitting

Open `index.html` and replace the placeholders in the footer:
```html
<p><strong>Your Full Name</strong> · <a href="mailto:your.email@example.com">your.email@example.com</a></p>
```
with your real name and a reachable email address.

## File structure

```
emi-calculator/
├── index.html      # Markup
├── styles.css       # Styling (ledger/receipt design system)
├── script.js        # EMI math, validation, schedule rendering, CSV export
└── README.md
```
