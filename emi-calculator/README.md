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


