# Level 4 release checklist

This checklist maps the Rise In **Level 4 — Waxing Gibbous Submission** requirements and the program instruction transcript supplied by the applicant. The submission itself remains intentionally untouched.

## Requirement audit

| Requirement | Evidence | Status |
| --- | --- | --- |
| Working MVP and Preprod contract | [Hosted organizer and participant clients](https://daveaire.github.io/veil-consent/); [explorer-linked contract](https://preprod.midnightexplorer.com/contracts/0x6f995e8986feb2b107a7e65e650413ef150fe63bf88285a88c3da4c505d5ddcd); [create, issue, and consume finalized at block `2702471`](docs/PREPROD.md) | Ready |
| Multiple wallet support, loading states, and error handling | Compatible injected wallets are enumerated, selectable, and validated against Preprod; each asynchronous workflow has pending, success, and failure states | Ready |
| README, architecture, setup, usage, and security documentation | `README.md`, `ARCHITECTURE.md`, `docs/USAGE.md`, `DEMO.md`, and `SECURITY.md` | Ready |
| CI/CD running on the product repository | [CI workflow](https://github.com/daveaire/veil-consent/actions/workflows/ci.yml), [Pages workflow](https://github.com/daveaire/veil-consent/actions/workflows/pages.yml), and scheduled [Preprod verification](https://github.com/daveaire/veil-consent/actions/workflows/preprod.yml) | Ready |
| Public product X profile and initial product update | [@VeilConsent](https://x.com/VeilConsent) is configured and linked; reviewed launch copy is in `PRODUCT-PROFILE.md` | Profile ready; first post held by applicant |
| At least 15 meaningful commits | 42 scoped, descriptive commits through `a9cee46` | Ready |
| Feedback/onboarding mechanism | [Privacy-minimizing structured feedback form](https://github.com/daveaire/veil-consent/issues/new?template=feedback.yml) with a public implementation log | Ready |
| Read-only Preprod verification | `npm run network:verify -- --network preprod` confirms status `4`, one request, one issue, and one consumption from the live indexer | Ready |

## Submission checklist

Reviewed narrative copy is maintained in [`docs/LEVEL-4-SUBMISSION.md`](docs/LEVEL-4-SUBMISSION.md).

| Required field | Final value |
| --- | --- |
| Public GitHub repository | `https://github.com/daveaire/veil-consent` |
| Live Preprod demo | `https://daveaire.github.io/veil-consent/` |
| Contract address | `https://preprod.midnightexplorer.com/contracts/0x6f995e8986feb2b107a7e65e650413ef150fe63bf88285a88c3da4c505d5ddcd` |
| CI/CD evidence | `https://github.com/daveaire/veil-consent/actions/workflows/ci.yml` |
| Product X profile | `https://x.com/VeilConsent` |
| Demo video | `https://daveaire.github.io/veil-consent/veil-consent-mvp.mp4` |
| Commit evidence | `https://github.com/daveaire/veil-consent/commits/main/` |

## Final review

- Confirm the demo URL loads in a private browser window.
- Run `npm run network:verify -- --network preprod` and confirm the final contract state resolves against the Preprod indexer.
- Run `npm ci && npm run check && npm run build` from a clean checkout.
- Watch the uploaded video once with sound muted; all essential information must remain in captions.
- Confirm the README contains the final X profile, contract, demo, and video links.
- Publish the prepared first product post only when the applicant lifts the explicit hold on posting. Until then, the transcript's “start posting” instruction remains deliberately incomplete.
- Paste the public repository URL into Rise In only after the checks above pass.

## Scope disclosed to reviewers

The hosted interactive walkthrough executes the generated Compact circuits locally so a reviewer can exercise the privacy state machine without test tokens or a proof server. The separate deployment record proves the same compiled contract completed create → issue → consume on Preprod. The wallet selector connects to compatible Preprod wallets, but the hosted buttons do not claim to submit those local walkthrough actions on-chain. Direct browser transaction submission is a Level 5 integration milestone because hosted proving requires a compatible wallet proving provider or an HTTPS proof service.
