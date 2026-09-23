# Security

## Supported status

VeilConsent is a Preprod MVP. It is suitable for testing the consent protocol with non-sensitive sample data. Do not use it to authorize processing of production personal, legal, medical, employment, or financial records.

## Security properties in the MVP

- Content and purpose binding through persistent commitments
- Private policy evaluation in generated Compact circuits
- Organizer-authorized revocation
- Request expiry checks
- Response and capability replay protection
- One-time approval credentials verified by private preimage proofs
- AES-256-GCM encryption for sample documents and response records
- Owner-only, ignored wallet and private-state credentials

## Known limitations

- The demonstration generates all sample credentials in one organizer-controlled client. Real participants must generate their secrets independently, provide only commitments during enrollment, and release a secret only to approve the bound request.
- The browser holds the sample encryption key. A production gateway must use KMS or an HSM and release a key only after finalized contract-state verification and capability consumption.
- The contract cannot erase plaintext copied after authorized release or prove that an external model provider followed its retention policy.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for the public repository. Include the affected commit, reproduction steps, expected impact, and any suggested mitigation. Do not include real personal data, wallet recovery material, or private keys in a report.
