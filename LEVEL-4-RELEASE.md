# Level 4 release checklist

This checklist mirrors the live Rise In **Level 4 — Waxing Gibbous Submission** page as verified on 23 September 2026. The submission itself remains intentionally untouched until every public artifact has been checked.

## Passing requirements

| Requirement | Evidence | Status |
| --- | --- | --- |
| Working MVP live on Preprod with a verifiable address | Contract `34ee0e9eca8646508c89f6f829bdb7d4ac653d8b1f7acca53874e50b0c774840`; [create, issue, and consume finalized at block `2680940`](docs/PREPROD.md) | Ready |
| README, setup, and usage documentation | `README.md`, `ARCHITECTURE.md`, and `DEMO.md` | Ready |
| CI/CD running on the product repository | [Passing CI](https://github.com/daveaire/veil-consent/actions/runs/35909058271) and [passing Pages deployment](https://github.com/daveaire/veil-consent/actions/runs/35909058252) | Ready |
| Public product X profile linked in README | [@VeilConsent](https://x.com/VeilConsent) and copy in `PRODUCT-PROFILE.md` | Ready |
| At least 15 meaningful commits | More than 30 scoped commits on `main` before final release-link updates | Ready |

## Submission checklist

| Required field | Final value |
| --- | --- |
| Public GitHub repository | `https://github.com/daveaire/veil-consent` |
| Live Preprod demo | `https://daveaire.github.io/veil-consent/` |
| Contract address | `34ee0e9eca8646508c89f6f829bdb7d4ac653d8b1f7acca53874e50b0c774840` |
| CI/CD evidence | `https://github.com/daveaire/veil-consent/actions/runs/35909058271` |
| Product X profile | `https://x.com/VeilConsent` |
| Demo video | `https://daveaire.github.io/veil-consent/veil-consent-mvp.mp4` |
| Commit evidence | `https://github.com/daveaire/veil-consent/commits/main/` |

## Final review

- Confirm the demo URL loads in a private browser window.
- Confirm the final contract state resolves against the Preprod indexer.
- Run `npm ci && npm run check && npm run build` from a clean checkout.
- Watch the uploaded video once with sound muted; all essential information must remain in captions.
- Confirm the README contains the final X profile, contract, demo, and video links.
- Paste the public repository URL into Rise In only after the checks above pass.
