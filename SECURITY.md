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
- Permanent on-chain rejection of pseudonymous credential reuse across requests
- AES-256-GCM encryption for sample documents and response records
- Independent participant enrollment and ephemeral P-256 ECDH response packets with HKDF-SHA-256 key derivation
- Request-bound authenticated encryption and enrolled-credential verification
- Decline-safe response packets that never disclose a valid approval witness
- Signed organizer invitations with out-of-band fingerprint verification
- Separate participant-held revocation credentials and a withdrawal circuit
- Canonical purpose policies enforced against task, model, recipient, and retention configuration
- Cryptographically random, owner-only deployment witness state
- External JavaScript bundles under a restrictive browser content security policy
- Owner-only, ignored wallet and private-state credentials

## Known limitations

- The quick local walkthrough generates sample credentials in one organizer-controlled client. Use the independent participant workflow to generate secrets in separate browsers and exchange encrypted response packets.
- Packet exchange has no authenticated delivery service in the static MVP. Organizers and participants must confirm their communication channel and invitation source out of band.
- Enrollment keys are pseudonymous credentials, not proof of a person's civil or organizational identity. Their random commitments are public so the contract can reject reuse; their preimages stay private. Production deployments must bind them to an approved wallet, identity provider, or verifiable credential issuer.
- Participants verify the organizer's invitation signature and fingerprint, but cannot independently open the full private on-chain request commitment. The MVP therefore trusts the organizer to construct the invitation from the same private purpose used by the Compact witness.
- Participant withdrawal is enforced by the new contract circuit. The hosted static participant page retains the withdrawal secret but still needs a wallet-backed transaction adapter before it can submit that circuit directly to Preprod.
- The random participant revocation handle used to withdraw is disclosed during the transaction. It is pseudonymous but can reveal which enrolled slot withdrew if enrollment transport is correlated.
- The browser holds the sample encryption key. A production gateway must use KMS or an HSM and release a key only after finalized contract-state verification and capability consumption.
- The contract cannot erase plaintext copied after authorized release or prove that an external model provider followed its retention policy.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for the public repository. Include the affected commit, reproduction steps, expected impact, and any suggested mitigation. Do not include real personal data, wallet recovery material, or private keys in a report.

The resolved findings and remaining integration boundaries are tracked in [docs/SECURITY-REVIEW.md](docs/SECURITY-REVIEW.md).
