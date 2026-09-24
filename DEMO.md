# Demo walkthrough

The walkthrough is designed for a two-minute review.

1. Open the hosted VeilConsent interface and connect Lace on Preprod. Explain that the interactive walkthrough runs the generated Compact circuits locally; the verified deployment panel records the separately finalized Preprod lifecycle.
2. Show the private sample document and the exact task, model, recipients, and retention fields.
3. Open the participant portal and show independent one-time enrollment plus review of the exact purpose terms.
4. Choose “Any 2 of 3,” keep two approvals selected, and create the request.
5. Point out that the plaintext field is cleared and only a commitment appears in the circuit panel.
6. Prove consent. The capability is issued while identities, decisions, and threshold remain hidden.
7. Process once. The adapter returns a short summary and generated contract state becomes consumed.
8. Explain that a second consumption fails because the capability is single-use.

The submission video runs for more than one minute and uses a warm neural English narration with matching on-screen summaries. It is generated from the real organizer and participant interfaces, contains no stock avatar, and does not simulate a chain confirmation. The final scene identifies the separately finalized Preprod lifecycle, which reviewers can check through the published transaction record and the read-only `network:verify` command.

Install the pinned video dependencies and rebuild it with:

```sh
python3 -m pip install -r requirements-demo.txt
npm run demo:video
```

[Watch the published walkthrough](https://daveaire.github.io/veil-consent/veil-consent-mvp.mp4).
