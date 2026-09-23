# How to Use VeilConsent

## What You Need

- A current desktop browser
- Lace, unlocked and set to Midnight Preprod, when connecting a wallet
- A document or transcript that requires consent from several people
- A clear description of the AI task, model, recipients, and retention period

The browser demonstration can be completed without spending test tokens. Connecting a compatible wallet shows that it is on the expected network; the generated Compact contract executes locally for a quick review. The demo creates sample one-time participant credentials in the browser. A deployed integration gives each participant a separate client that creates its own secret and shares only the commitment until approval.

## Step-by-Step Guide

1. Open VeilConsent and review the document and the proposed AI use.
2. Choose the consent rule and expiry. The sample supports one, two, or all three eligible participants.
3. Select the participants who approve, then choose **Create request**. VeilConsent encrypts the document, clears the visible plaintext, and publishes a binding commitment.
4. Choose **Prove consent**. The circuit checks the private responses and policy. If the rule is not satisfied, the interface shows the reason and no capability is issued.
5. Choose **Process once**. The gateway consumes the capability, decrypts the bound document, and returns the sample AI output.
6. Try the action again. Contract state rejects the replay because the capability has already been consumed.

Before capability issuance, an organizer can choose **Revoke**. Expired or revoked requests cannot authorize processing.

## What Gets Proved (and What Stays Private)

Midnight verifies that enough eligible participants approved, the request is active, and the capability is bound to the committed document and purpose. The ledger records commitments, expiry, status, counters, and a one-time response nullifier.

The document, purpose details, participant identities, credentials, individual decisions, threshold, organizer secret, encryption key, and capability secret stay private.

## Troubleshooting

**Lace is not detected**  
Install or unlock Lace, select Midnight Preprod, and choose **Refresh**.

**Wallet connection fails**  
Confirm Lace is on Preprod and that the connection request was approved in the wallet.

**Consent proof is rejected**  
Check that the selected approvals satisfy the private rule and that the request has not expired or been revoked.

**The processing button is unavailable**  
A capability must first be issued. A consumed or revoked capability cannot be restored; create a new request.

**Local page does not load**  
Run `npm ci`, `npm run build`, and `npm run dashboard`, then open <http://127.0.0.1:4210>.
