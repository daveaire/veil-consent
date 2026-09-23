# Preprod deployment record

VeilConsent was deployed to Midnight Preprod on 23 September 2026.

| Field | Value |
| --- | --- |
| Contract | `34ee0e9eca8646508c89f6f829bdb7d4ac653d8b1f7acca53874e50b0c774840` |
| Lifecycle block | `2680940` |
| Final request status | `4` — consumed |
| Request commitment | `b8b822438023d8441703f3fdb554405f6d3d32c8f0a047bbb7fd0d4b0a8587fa` |
| Capability commitment | `a911084aad4d88e80968b8a0dd6e1da1cb1e9e7609bb81fe330a6beceb0f73ba` |

## Finalized lifecycle transactions

| Operation | Transaction ID |
| --- | --- |
| Create request | `00439acbb13bf353b72abb81b6799bbf5fa9bb67d8f3f9177c9215cb88d056edb4` |
| Issue capability | `0033c4886154753095b97c79a839ee2f09b006b8f4da84fff010182e637f544cad` |
| Consume capability | `00d2939336889430c7d84375246985788c83bc6dae2a5bf9a023b4967b86b4b7bf` |

The lifecycle was executed with `npm run network:prove -- --network preprod`. After the consume transaction finalized, the client queried the contract through the Preprod indexer and decoded status `4` from the public ledger.

Only commitments, lifecycle state, expiry, counters, and replay-prevention nullifiers are public. Participant identity, individual decisions, the consent threshold, the exact purpose, and document contents remain private.
