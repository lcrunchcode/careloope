# CareLoop — Closing the Screening-to-Care Loop

Entry for the **Future Health Digital Innovation Challenge** (Hack2skill), Population Health, Challenge 05.

CareLoop tracks every actionable screening result from the lab to a documented, clinician-signed closure, with a named owner at each step. A tamper-proof record on **0G Mainnet** proves who did what and when.

## What it does
- **Manager:** control tower showing open, overdue, unowned and rejected cases.
- **Lab:** issues an abnormal result and sends a referral. A small consult fee is held in escrow.
- **Specialist:** accepts or rejects, books, marks attended, and signs off to close.
- **Patient:** plain-language result (English and Arabic), acknowledgement, and confirmation that care was received.

Payment is released only after the patient or the lab confirms care **and** a clinician signs off. A fingerprint of the closing record is written to 0G and can be verified in the app.

## Privacy
- Demo uses **synthetic patients only**. References must look like `PT-2041`.
- **No personal or health data is written to the blockchain**, only transactions, timestamps and a hash.

## Run it
It is a single static file. No build step.
1. Deploy `index.html` (e.g. on Vercel) or open it from any web host.
2. Use MetaMask on **0G Mainnet (chain ID 16661)**.
3. Demo with two accounts (Lab and Specialist) in one browser.

## Known limits
- Case progress is stored in the browser (localStorage), not on-chain or in a shared database.
- On-chain today: slot opened, referral, fee held, fee released, closing fingerprint.
- Arabic wording needs clinician and native-speaker review before real use.
- Demo fee is 0.001 OG; a real deployment would use normal invoicing and keep the chain for audit and release rules.

## Contracts (0G Mainnet)
See the address constants at the top of the script in `index.html`.
