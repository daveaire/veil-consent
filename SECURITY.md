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
- Independent participant enrollment and ephemeral P-256 ECDH response packets with HKDF-SHA-256 key derivation
- Request-bound authenticated encryption and enrolled-credential verification
- Cryptographically random, owner-only deployment witness state
- External JavaScript bundles under a restrictive browser content security policy
- Owner-only, ignored wallet and private-state credentials

## Known limitations

- The quick local walkthrough generates sample credentials in one organizer-controlled client. Use the independent participant workflow to generate secrets in separate browsers and exchange encrypted response packets.
- Packet exchange has no authenticated delivery service in the static MVP. Organizers and participants must confirm their communication channel and invitation source out of band.
- Participants authenticate the exact purpose terms inside their encrypted response, but cannot independently open the full private on-chain request commitment. The MVP therefore trusts the organizer to construct the invitation from the same private purpose used by the Compact witness.
- The browser holds the sample encryption key. A production gateway must use KMS or an HSM and release a key only after finalized contract-state verification and capability consumption.
- The contract cannot erase plaintext copied after authorized release or prove that an external model provider followed its retention policy.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting for the public repository. Include the affected commit, reproduction steps, expected impact, and any suggested mitigation. Do not include real personal data, wallet recovery material, or private keys in a report.
