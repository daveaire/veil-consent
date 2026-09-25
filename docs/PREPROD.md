# Preprod deployment record

VeilConsent was deployed to Midnight Preprod on 25 September 2026. This deployment contains the hardened v3 packet protocol, participant-withdrawal circuit, executable purpose policy, and one-time credential registry on `main`.

| Field | Value |
| --- | --- |
| Contract | [`6f995e8986feb2b107a7e65e650413ef150fe63bf88285a88c3da4c505d5ddcd`](https://preprod.midnightexplorer.com/contracts/0x6f995e8986feb2b107a7e65e650413ef150fe63bf88285a88c3da4c505d5ddcd) |
| Lifecycle block | `2702471` |
| Final request status | `4` — consumed |
| Request commitment | `9893a0724121be79d15610facfd81903d93e6bce92d84007d2363d9977d91811` |
| Capability commitment | `3286eb4ade850f7ad3e29fbd7e009050731e924116ec769ad72f0f96f751e5f6` |

## Finalized lifecycle transactions

| Operation | Transaction ID |
| --- | --- |
| Create request | `0098474fb0848b2f588dd8948046e19dcc9a60df049ac695c1248f99209340392f` |
| Issue capability | `004ba33bc440313d1964cc88690667ce9644f085c6918b5e81f5d905f58cf5f410` |
| Consume capability | `00676d839696328a906c1375c1e22e0502eb65f15850232d04950645b9d3f3779f` |

The lifecycle was executed with `npm run network:prove -- --network preprod`. After the consume transaction finalized, the client queried the contract through the Preprod indexer and decoded status `4` from the public ledger.

The same public state can be checked without wallet credentials or a proof server:

```sh
npm run network:verify -- --network preprod
```

The command reads the tracked deployment record in `deployments/preprod.json`, queries the Preprod indexer, decodes the generated ledger, and fails unless the current lifecycle status is `4` (consumed).

Request and capability commitments, one-time pseudonymous credential commitments, random revocation handles, lifecycle state, expiry, counters, and replay-prevention nullifiers are public in this deployment. Legal identity, credential preimages, individual decisions, the consent threshold, the exact purpose, and document contents remain private.
