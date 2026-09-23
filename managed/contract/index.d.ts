import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  privateContentHash(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  privatePurposeHash(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  privatePolicySalt(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  privateThreshold(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  privateOrganizerSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  privateRequestNonce(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  privateCredentialA(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  privateCredentialB(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  privateCredentialC(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  privateDecisionA(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  privateDecisionB(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  privateDecisionC(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  privateCapabilitySecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  createRequest(context: __compactRuntime.CircuitContext<PS>, expiry_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  issueCapability(context: __compactRuntime.CircuitContext<PS>,
                  observedAt_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  consumeCapability(context: __compactRuntime.CircuitContext<PS>,
                    observedAt_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  revokeRequest(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type ProvableCircuits<PS> = {
  createRequest(context: __compactRuntime.CircuitContext<PS>, expiry_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  issueCapability(context: __compactRuntime.CircuitContext<PS>,
                  observedAt_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  consumeCapability(context: __compactRuntime.CircuitContext<PS>,
                    observedAt_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  revokeRequest(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type PureCircuits = {
  requestCommitment(contentHash_0: Uint8Array,
                    purposeHash_0: Uint8Array,
                    policySalt_0: Uint8Array,
                    threshold_0: bigint,
                    organizerSecret_0: Uint8Array,
                    requestNonce_0: Uint8Array,
                    credentialA_0: Uint8Array,
                    credentialB_0: Uint8Array,
                    credentialC_0: Uint8Array,
                    expiry_0: bigint): Uint8Array;
  responseNullifier(requestNonce_0: Uint8Array,
                    credentialA_0: Uint8Array,
                    credentialB_0: Uint8Array,
                    credentialC_0: Uint8Array): Uint8Array;
  capabilityFor(request_0: Uint8Array,
                contentHash_0: Uint8Array,
                purposeHash_0: Uint8Array,
                secret_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  createRequest(context: __compactRuntime.CircuitContext<PS>, expiry_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  issueCapability(context: __compactRuntime.CircuitContext<PS>,
                  observedAt_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  consumeCapability(context: __compactRuntime.CircuitContext<PS>,
                    observedAt_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  revokeRequest(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, Uint8Array>;
  requestCommitment(context: __compactRuntime.CircuitContext<PS>,
                    contentHash_0: Uint8Array,
                    purposeHash_0: Uint8Array,
                    policySalt_0: Uint8Array,
                    threshold_0: bigint,
                    organizerSecret_0: Uint8Array,
                    requestNonce_0: Uint8Array,
                    credentialA_0: Uint8Array,
                    credentialB_0: Uint8Array,
                    credentialC_0: Uint8Array,
                    expiry_0: bigint): __compactRuntime.CircuitResults<PS, Uint8Array>;
  responseNullifier(context: __compactRuntime.CircuitContext<PS>,
                    requestNonce_0: Uint8Array,
                    credentialA_0: Uint8Array,
                    credentialB_0: Uint8Array,
                    credentialC_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  capabilityFor(context: __compactRuntime.CircuitContext<PS>,
                request_0: Uint8Array,
                contentHash_0: Uint8Array,
                purposeHash_0: Uint8Array,
                secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  readonly requestsCreated: bigint;
  readonly capabilitiesIssued: bigint;
  readonly capabilitiesConsumed: bigint;
  readonly revocations: bigint;
  readonly activeRequest: Uint8Array;
  readonly activeExpiry: bigint;
  readonly requestStatus: bigint;
  readonly activeCapability: Uint8Array;
  readonly lastResponseNullifier: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
