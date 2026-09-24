# Level 4 submission copy

This document is the reviewed copy-and-paste package for the Rise In Level 4 form. It is not a record of submission.

## Project

**Name:** VeilConsent  
**Track:** Tooling & Infrastructure  
**Category:** Developer tooling  
**Network:** Midnight Preprod

## Product overview

VeilConsent is a private multi-party consent gate for AI processing. It prevents an organizer or processing gateway from using a shared document until the required participants have authorized one exact task, model, recipient class, retention term, and expiry.

Participants create one-time credentials in a separate browser portal and return request-bound encrypted responses. A Compact contract evaluates the private threshold or unanimous policy and issues a single-use processing capability. The public ledger records commitments and lifecycle state while participant identities, individual decisions, policy threshold, exact purpose, and document contents remain private. Revocation, expiry, credential reuse, and capability replay are rejected.

The hosted walkthrough runs the generated Compact circuits locally so reviewers can exercise the complete state machine without test tokens. The same compiled contract is deployed on Preprod and has a finalized create → issue → consume lifecycle that can be independently queried from the Preprod indexer.

## Why Midnight

A conventional public contract would expose the consent record it is meant to protect. Midnight allows VeilConsent to prove that the required authorization exists without publishing who participated, how each person responded, or which private threshold applied. Compact also binds the resulting capability to the committed content and purpose and makes it usable once.

## Evidence links

- Repository: https://github.com/daveaire/veil-consent
- Live product: https://daveaire.github.io/veil-consent/
- Participant portal: https://daveaire.github.io/veil-consent/participant.html
- Demo video: https://daveaire.github.io/veil-consent/veil-consent-mvp.mp4
- Preprod contract: https://preprod.midnightexplorer.com/contracts/0x34ee0e9eca8646508c89f6f829bdb7d4ac653d8b1f7acca53874e50b0c774840
- CI: https://github.com/daveaire/veil-consent/actions/workflows/ci.yml
- Scheduled Preprod verification: https://github.com/daveaire/veil-consent/actions/workflows/preprod.yml
- Product profile: https://x.com/VeilConsent
- Feedback form: https://github.com/daveaire/veil-consent/issues/new?template=feedback.yml

## Reviewer verification

```sh
git clone https://github.com/daveaire/veil-consent.git
cd veil-consent
npm ci
npm run compile
npm run check
npm run build
npm run network:verify -- --network preprod
```

Expected public state: request status `4` (consumed), one request, one issued capability, and one consumed capability.

## Scope statement

VeilConsent proves authorization to process committed data for a committed purpose. It does not prove that a model output is correct, erase plaintext copied after authorized release, or enforce an external model provider's retention policy.
