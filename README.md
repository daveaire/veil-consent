# VeilConsent

[![CI](https://github.com/daveaire/veil-consent/actions/workflows/ci.yml/badge.svg)](https://github.com/daveaire/veil-consent/actions/workflows/ci.yml)

VeilConsent is a privacy-preserving consent gate for AI processing. It binds an encrypted document to one exact purpose and issues a single-use processing capability only after a private multi-party consent rule has been satisfied.

![VeilConsent request screen](docs/veil-consent-product.png)

A public verifier sees a request commitment, its expiry, lifecycle status, and aggregate counters. Participant identities, individual approve/decline responses, the threshold, document contents, model, recipients, and retention terms remain private.

## The problem

A meeting recording, interview, group transcript, or shared document can contain information belonging to several people. Most AI tools let one organizer submit that material. Consent from everyone else is often assumed, recorded in a database visible to an administrator, or detached from the exact purpose that was approved.

VeilConsent makes authorization a prerequisite for processing:

1. The organizer encrypts the document locally.
2. A Compact contract commits to the content, purpose, eligible credentials, private policy, expiry, and organizer authority.
3. Participants submit one response per credential. The response vault stores those responses encrypted.
4. A zero-knowledge circuit proves that the committed policy is satisfied without publishing identities, decisions, or threshold.
5. The contract issues a capability bound to the same content and purpose.
6. The AI gateway consumes the capability before decrypting and processing the document.
7. Consumption changes public contract state, so the capability cannot be replayed.

## Level 4 MVP

- Generated Compact 0.23 circuits for request creation, issuance, consumption, and revocation
- Threshold policies for one, two, or three participants, including unanimous consent
- One-time participant credentials and encrypted response storage
- AES-256-GCM document encryption before consent collection
- Capability binding to content and exact processing purpose
- Expiry checks, organizer-authorized revocation, and replay protection
- In-browser circuit execution and a Lace connector restricted to Midnight Preprod
- Midnight.js deployment and three-transaction proof workflow
- Automated privacy and lifecycle tests

The browser demonstration uses a local generated-contract session so reviewers can exercise every branch without spending test tokens. The repository also includes the Midnight.js workflow used to deploy the same generated contract and submit cryptographic proof transactions on Preprod.

## Run locally

Requirements: Node.js 22 or later, npm 10 or later, and Compact toolchain 0.31.1. Docker is needed only for network proof generation.

```sh
npm ci
npm run check
npm run build:web
npm run dashboard
```

Open <http://127.0.0.1:4210>. Create a request, change the private responses, prove consent, and process the encrypted sample once. Repeating the final action is rejected by contract state.

The command-line demonstration runs the same lifecycle:

```sh
npm run demo
```

Build the 20-second captioned product walkthrough from the real browser interface:

```sh
npm run demo:video
```

The rendered file is written to `demo-output/veil-consent-mvp.mp4`. It is silent by design so the review remains clear without synthetic narration.

## Preprod

The contract targets the ledger-v8 Preprod stack used by Midnight.js 4.1.1:

- Compact toolchain 0.31.1
- Compact language 0.23
- Compact runtime 0.16.0
- Midnight.js 4.1.1
- proof server 8.1.0

Select Preprod, obtain the wallet address, fund it with test NIGHT, start the proof server, and deploy:

```sh
npm run network:select -- preprod
npm run network:address -- --network preprod
npm run proof-server:start
npm run compile
npm run network:deploy -- --network preprod
npm run network:prove -- --network preprod
```

Wallet recovery material, the generated private-state password, and private-state databases are owner-only and excluded from version control.

## Public and private data

| Public ledger data | Private witness or local data |
| --- | --- |
| Request commitment | Document and encryption key |
| Expiry | Exact purpose, model, recipients, retention |
| Request status | Participant identities and credentials |
| Lifecycle counters | Individual consent decisions |
| Capability commitment | Policy threshold and organizer secret |
| Response nullifier | Capability secret |

The current MVP accepts an `observedAt` value as a public circuit input for expiry enforcement. A production release must bind this value to a network-attested time source or ledger primitive before treating expiry as trustless. The demo and gateway use the current clock and expose the value in the circuit transcript.

## Security boundary

VeilConsent proves authorization to process committed data for a committed purpose. It does not prove that an AI response is correct, erase copies made outside the gateway, or control a model provider after plaintext has been released. The gateway is intentionally small so deployments can place it inside their own trusted environment.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the protocol and threat model and [DEMO.md](DEMO.md) for the review walkthrough.

## Product profile

The product X profile and public URL will be added here before the Level 4 submission is sent for review.

## License

Apache-2.0
