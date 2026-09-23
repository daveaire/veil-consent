# VeilConsent — Approved Level 3 Proposal

**Track:** Tooling & Infrastructure  
**Category:** Dev tooling

VeilConsent is a privacy-preserving, multi-party consent gate for AI processing. A meeting recording, group transcript, interview, or collaborative document can contain private information belonging to several people, but today one organizer can send it to an AI service while everyone else's consent is either assumed or stored in an administrator-visible log.

With VeilConsent, an organizer creates a request bound to one content commitment and one exact purpose: for example, transcription, summarization, external-model analysis, a recipient class, and a retention deadline. Eligible participants privately approve or decline with one-time consent credentials. A Midnight Compact contract proves that the required consent rule has been satisfied and issues a single-use processing capability without revealing participant identities, individual decisions, or the private policy threshold. If consent is missing, expired, or revoked, no capability is issued. An AI gateway consumes that capability only for the committed content and purpose, preventing reuse for a different model or later secondary use.

For Level 4, I will ship a Lace-connected Preprod MVP with consent-request creation, private responses, unanimous and threshold policies, expiry, revocation, replay protection, and an encrypted sample document that the AI adapter cannot process without a valid capability. For Level 5, I will add an SDK and meeting/document adapter, onboard 50 Preprod testers, and publish feedback-driven changes. For Level 6, I will deploy to Mainnet and onboard 20 real users.

VeilConsent proves authorization to process data. It does not claim to prove that an AI output is correct or that every external copy was deleted.
