# VPS deployment

The live pilot is an isolated Compose project. It does not publish application,
database, or proof-server ports on the host. The existing Caddy container joins
the shared `deploy_reward-net` network and reaches only the API alias
`veil-api:4210`.

## Required private files

Create these files on the VPS; never commit them:

- `infrastructure/.env.production`
- `infrastructure/secrets/postgres_password` with mode `0600`
- `infrastructure/state/.midnight-state.json` with mode `0600`
- `infrastructure/state/.midnight-private-state-password` with mode `0600`
- `infrastructure/state/.midnight-wallet-state/`

`PRIVATE_STATE_PASSWORD` must be at least 16 characters and contain at least
three of these classes: uppercase letters, lowercase letters, digits, and
special characters. A hexadecimal-only value is rejected by Midnight.js.

The Midnight state must identify `preprod`, the existing deployed contract, and
the funded operations wallet. The OpenAI key must belong to a dedicated project
with a conservative spend limit.

Initialize a dedicated VPS-only Preprod wallet and attach the repository's
published deployment record without synchronizing or exposing recovery material:

```sh
docker compose run --rm --no-deps worker \
  /app/node_modules/.bin/tsx /app/network/initialize-live-wallet.ts
```

Fund only the printed public address with Preprod test tokens, register that
tNIGHT for DUST generation, and keep `.midnight-state.json` owner-readable only.

## Safe deployment sequence

1. Back up the current VPS Caddyfile and record existing container health.
2. Build the VeilConsent image without changing running services.
3. Start PostgreSQL, the proof server, API, and worker on their private network.
4. Verify API and database health from inside the Docker network.
5. Add `Caddyfile.fragment` to the existing Caddyfile and run `caddy validate`.
6. Reload Caddy without recreating it.
7. Confirm all pre-existing containers remain healthy and their endpoints still respond.

Rollback removes the added Caddy site and stops only the `veil-consent` Compose
project. Named database data remains intact until explicitly deleted.

## Trust boundary

This is a real Preprod pilot, not a production environment for sensitive data.
The organizer service sees encrypted participant approval witnesses and the
worker receives plaintext after finalized capability consumption. All services
share one VPS failure domain. A paid or sensitive-data launch requires separate
key custody, isolated workers, off-host encrypted backups, organization identity,
and an independent application and contract security review.
