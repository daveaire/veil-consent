# Security review status

This register records the high-impact protocol findings reviewed for the hardened MVP. It separates completed controls from residual product boundaries so the interface and submission materials do not overstate protection.

| Finding | Severity before mitigation | Control | Status |
| --- | --- | --- | --- |
| A declined packet exposed material that an organizer could turn into an approval | Critical | Packet v3 omits the approval preimage on decline; the Compact circuit requires the missing preimage for an affirmative decision | Fixed and adversarially tested |
| An organizer could reuse a participant credential in a later request | High | `createRequest` publishes the random credential commitment, permanently registers it, and rejects any later enrollment | Fixed and adversarially tested |
| Participants could not revoke without the organizer | High | Separate participant-held revocation secrets and `withdrawConsent` circuit | Fixed in the contract and tested; hosted wallet transaction adapter remains pending |
| Invitation terms could be modified in transit | High | Per-request ECDSA signature, trusted fingerprint comparison, and a review-to-answer binding that rejects post-review changes | Fixed and tested |
| Purpose text was committed but execution settings were not checked | High | Versioned canonical policy plus gateway checks for task, model, recipient, and maximum retention before capability consumption and decryption | Fixed and tested |
| The organizer could create all pseudonymous enrollments | High | Product claims now describe pseudonymous credentials accurately and require an external wallet, identity provider, or verifiable credential issuer for real-world identity assurance | Residual integration boundary |
| Revocation could imply deletion of data already released | High | UI and documentation explicitly state that revocation blocks future gateway access and cannot erase prior plaintext or external copies | Disclosed product boundary |
| Hosted controls appeared to submit to Preprod | High | UI labels wallet use as a compatibility check and separates the local circuit walkthrough from the finalized Preprod lifecycle | Fixed in UI and documentation |

The automated suite includes rejection tests for forged approval, invitation tampering, organizer fingerprint mismatch, credential reuse, wrong revocation secrets, purpose substitution, expiry, revocation, and replay. The participant client also rejects an invitation changed after review. Production dependency auditing currently reports zero known vulnerabilities.
