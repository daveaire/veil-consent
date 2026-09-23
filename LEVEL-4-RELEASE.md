# Level 4 release checklist

This checklist mirrors the live Rise In **Level 4 — Waxing Gibbous Submission** page as verified on 23 September 2026. The submission itself remains intentionally untouched until every public artifact has been checked.

## Passing requirements

| Requirement | Evidence | Status |
| --- | --- | --- |
| Working MVP live on Preprod with a verifiable address | Contract deployment record and successful lifecycle transaction IDs | In progress |
| README, setup, and usage documentation | `README.md`, `ARCHITECTURE.md`, and `DEMO.md` | Ready |
| CI/CD running on the product repository | `.github/workflows/ci.yml` and `.github/workflows/pages.yml` | Ready locally; passing public run required |
| Public product X profile linked in README | Copy and launch plan in `PRODUCT-PROFILE.md` | Profile URL required |
| At least 15 meaningful commits | More than 24 scoped commits on `main` | Ready |

## Submission checklist

| Required field | Final value |
| --- | --- |
| Public GitHub repository | `https://github.com/daveaire/veil-consent` |
| Live Preprod demo | Add the deployed Pages URL after the first passing workflow |
| Contract address | Add the address emitted by `npm run network:deploy -- --network preprod` |
| CI/CD evidence | Link the passing `CI` workflow run |
| Product X profile | Add the live profile URL to this file and `README.md` |
| Demo video | Upload `demo-output/veil-consent-mvp.mp4` and add its public URL |
| Commit evidence | Link the repository commit history |

## Final review

- Confirm the demo URL loads in a private browser window.
- Confirm the contract address resolves against the Preprod indexer.
- Run `npm ci && npm run check && npm run build:web` from a clean checkout.
- Watch the uploaded video once with sound muted; all essential information must remain in captions.
- Confirm the README contains the final X profile, contract, demo, and video links.
- Paste the public repository URL into Rise In only after the checks above pass.
