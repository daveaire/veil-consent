import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.16.0');

const _descriptor_0 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_1 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

const _descriptor_2 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

const _descriptor_3 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const _descriptor_4 = new __compactRuntime.CompactTypeVector(11, _descriptor_0);

const _descriptor_5 = new __compactRuntime.CompactTypeVector(5, _descriptor_0);

const _descriptor_6 = __compactRuntime.CompactTypeBoolean;

class _Either_0 {
  alignment() {
    return _descriptor_6.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_6.fromValue(value_0),
      left: _descriptor_0.fromValue(value_0),
      right: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_6.toValue(value_0.is_left).concat(_descriptor_0.toValue(value_0.left).concat(_descriptor_0.toValue(value_0.right)));
  }
}

const _descriptor_7 = new _Either_0();

const _descriptor_8 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

class _ContractAddress_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_9 = new _ContractAddress_0();

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.privateContentHash) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named privateContentHash');
    }
    if (typeof(witnesses_0.privatePurposeHash) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named privatePurposeHash');
    }
    if (typeof(witnesses_0.privatePolicySalt) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named privatePolicySalt');
    }
    if (typeof(witnesses_0.privateThreshold) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named privateThreshold');
    }
    if (typeof(witnesses_0.privateOrganizerSecret) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named privateOrganizerSecret');
    }
    if (typeof(witnesses_0.privateRequestNonce) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named privateRequestNonce');
    }
    if (typeof(witnesses_0.privateCredentialA) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named privateCredentialA');
    }
    if (typeof(witnesses_0.privateCredentialB) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named privateCredentialB');
    }
    if (typeof(witnesses_0.privateCredentialC) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named privateCredentialC');
    }
    if (typeof(witnesses_0.privateDecisionA) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named privateDecisionA');
    }
    if (typeof(witnesses_0.privateDecisionB) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named privateDecisionB');
    }
    if (typeof(witnesses_0.privateDecisionC) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named privateDecisionC');
    }
    if (typeof(witnesses_0.privateCapabilitySecret) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named privateCapabilitySecret');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      createRequest: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`createRequest: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const expiry_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('createRequest',
                                     'argument 1 (as invoked from Typescript)',
                                     'veil-consent.compact line 34 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(expiry_0) === 'bigint' && expiry_0 >= 0n && expiry_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('createRequest',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'veil-consent.compact line 34 char 1',
                                     'Uint<0..18446744073709551616>',
                                     expiry_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(expiry_0),
            alignment: _descriptor_3.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._createRequest_0(context,
                                               partialProofData,
                                               expiry_0);
        partialProofData.output = { value: _descriptor_0.toValue(result_0), alignment: _descriptor_0.alignment() };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      issueCapability: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`issueCapability: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const observedAt_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('issueCapability',
                                     'argument 1 (as invoked from Typescript)',
                                     'veil-consent.compact line 50 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(observedAt_0) === 'bigint' && observedAt_0 >= 0n && observedAt_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('issueCapability',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'veil-consent.compact line 50 char 1',
                                     'Uint<0..18446744073709551616>',
                                     observedAt_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(observedAt_0),
            alignment: _descriptor_3.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._issueCapability_0(context,
                                                 partialProofData,
                                                 observedAt_0);
        partialProofData.output = { value: _descriptor_0.toValue(result_0), alignment: _descriptor_0.alignment() };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      consumeCapability: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`consumeCapability: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const observedAt_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('consumeCapability',
                                     'argument 1 (as invoked from Typescript)',
                                     'veil-consent.compact line 79 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(observedAt_0) === 'bigint' && observedAt_0 >= 0n && observedAt_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('consumeCapability',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'veil-consent.compact line 79 char 1',
                                     'Uint<0..18446744073709551616>',
                                     observedAt_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(observedAt_0),
            alignment: _descriptor_3.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._consumeCapability_0(context,
                                                   partialProofData,
                                                   observedAt_0);
        partialProofData.output = { value: _descriptor_0.toValue(result_0), alignment: _descriptor_0.alignment() };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      revokeRequest: (...args_1) => {
        if (args_1.length !== 1) {
          throw new __compactRuntime.CompactError(`revokeRequest: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('revokeRequest',
                                     'argument 1 (as invoked from Typescript)',
                                     'veil-consent.compact line 89 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: { value: [], alignment: [] },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._revokeRequest_0(context, partialProofData);
        partialProofData.output = { value: _descriptor_0.toValue(result_0), alignment: _descriptor_0.alignment() };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      requestCommitment(context, ...args_1) {
        return { result: pureCircuits.requestCommitment(...args_1), context };
      },
      responseNullifier(context, ...args_1) {
        return { result: pureCircuits.responseNullifier(...args_1), context };
      },
      capabilityFor(context, ...args_1) {
        return { result: pureCircuits.capabilityFor(...args_1), context };
      }
    };
    this.impureCircuits = {
      createRequest: this.circuits.createRequest,
      issueCapability: this.circuits.issueCapability,
      consumeCapability: this.circuits.consumeCapability,
      revokeRequest: this.circuits.revokeRequest
    };
    this.provableCircuits = {
      createRequest: this.circuits.createRequest,
      issueCapability: this.circuits.issueCapability,
      consumeCapability: this.circuits.consumeCapability,
      revokeRequest: this.circuits.revokeRequest
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('createRequest', new __compactRuntime.ContractOperation());
    state_0.setOperation('issueCapability', new __compactRuntime.ContractOperation());
    state_0.setOperation('consumeCapability', new __compactRuntime.ContractOperation());
    state_0.setOperation('revokeRequest', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext(__compactRuntime.dummyContractAddress(), constructorContext_0.initialZswapLocalState.coinPublicKey, state_0.data, constructorContext_0.initialPrivateState);
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(1n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(2n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(3n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(4n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(new Uint8Array(32)),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(5n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(6n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(7n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(new Uint8Array(32)),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(8n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(new Uint8Array(32)),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_0 = 0n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(6n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_1 = 0n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(5n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(tmp_1),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_4, value_0);
    return result_0;
  }
  _persistentHash_1(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_5, value_0);
    return result_0;
  }
  _privateContentHash_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.privateContentHash(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('privateContentHash',
                                 'return value',
                                 'veil-consent.compact line 20 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _privatePurposeHash_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.privatePurposeHash(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('privatePurposeHash',
                                 'return value',
                                 'veil-consent.compact line 21 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _privatePolicySalt_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.privatePolicySalt(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('privatePolicySalt',
                                 'return value',
                                 'veil-consent.compact line 22 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _privateThreshold_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.privateThreshold(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('privateThreshold',
                                 'return value',
                                 'veil-consent.compact line 23 char 1',
                                 'Uint<0..18446744073709551616>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_3.toValue(result_0),
      alignment: _descriptor_3.alignment()
    });
    return result_0;
  }
  _privateOrganizerSecret_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.privateOrganizerSecret(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('privateOrganizerSecret',
                                 'return value',
                                 'veil-consent.compact line 24 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _privateRequestNonce_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.privateRequestNonce(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('privateRequestNonce',
                                 'return value',
                                 'veil-consent.compact line 25 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _privateCredentialA_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.privateCredentialA(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('privateCredentialA',
                                 'return value',
                                 'veil-consent.compact line 26 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _privateCredentialB_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.privateCredentialB(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('privateCredentialB',
                                 'return value',
                                 'veil-consent.compact line 27 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _privateCredentialC_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.privateCredentialC(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('privateCredentialC',
                                 'return value',
                                 'veil-consent.compact line 28 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _privateDecisionA_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.privateDecisionA(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('privateDecisionA',
                                 'return value',
                                 'veil-consent.compact line 29 char 1',
                                 'Uint<0..18446744073709551616>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_3.toValue(result_0),
      alignment: _descriptor_3.alignment()
    });
    return result_0;
  }
  _privateDecisionB_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.privateDecisionB(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('privateDecisionB',
                                 'return value',
                                 'veil-consent.compact line 30 char 1',
                                 'Uint<0..18446744073709551616>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_3.toValue(result_0),
      alignment: _descriptor_3.alignment()
    });
    return result_0;
  }
  _privateDecisionC_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.privateDecisionC(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0n && result_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('privateDecisionC',
                                 'return value',
                                 'veil-consent.compact line 31 char 1',
                                 'Uint<0..18446744073709551616>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_3.toValue(result_0),
      alignment: _descriptor_3.alignment()
    });
    return result_0;
  }
  _privateCapabilitySecret_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.privateCapabilitySecret(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('privateCapabilitySecret',
                                 'return value',
                                 'veil-consent.compact line 32 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_0.toValue(result_0),
      alignment: _descriptor_0.alignment()
    });
    return result_0;
  }
  _createRequest_0(context, partialProofData, expiry_0) {
    __compactRuntime.assert(this._equal_0(_descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 0 } },
                                                                                                     { idx: { cached: false,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_1.toValue(6n),
                                                                                                                                alignment: _descriptor_1.alignment() } }] } },
                                                                                                     { popeq: { cached: false,
                                                                                                                result: undefined } }]).value),
                                          0n)
                            ||
                            this._equal_1(_descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 0 } },
                                                                                                     { idx: { cached: false,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_1.toValue(6n),
                                                                                                                                alignment: _descriptor_1.alignment() } }] } },
                                                                                                     { popeq: { cached: false,
                                                                                                                result: undefined } }]).value),
                                          3n)
                            ||
                            this._equal_2(_descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 0 } },
                                                                                                     { idx: { cached: false,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_1.toValue(6n),
                                                                                                                                alignment: _descriptor_1.alignment() } }] } },
                                                                                                     { popeq: { cached: false,
                                                                                                                result: undefined } }]).value),
                                          4n),
                            'Previous request is still active');
    const threshold_0 = this._privateThreshold_0(context, partialProofData);
    __compactRuntime.assert(threshold_0 >= 1n && threshold_0 <= 3n,
                            'Threshold must be between one and three');
    const commitment_0 = this._requestCommitment_0(this._privateContentHash_0(context,
                                                                              partialProofData),
                                                   this._privatePurposeHash_0(context,
                                                                              partialProofData),
                                                   this._privatePolicySalt_0(context,
                                                                             partialProofData),
                                                   threshold_0,
                                                   this._privateOrganizerSecret_0(context,
                                                                                  partialProofData),
                                                   this._privateRequestNonce_0(context,
                                                                               partialProofData),
                                                   this._privateCredentialA_0(context,
                                                                              partialProofData),
                                                   this._privateCredentialB_0(context,
                                                                              partialProofData),
                                                   this._privateCredentialC_0(context,
                                                                              partialProofData),
                                                   expiry_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(4n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(commitment_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(5n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(expiry_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_0 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(6n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_1 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_1.toValue(0n),
                                                                  alignment: _descriptor_1.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_2.toValue(tmp_1),
                                                                alignment: _descriptor_2.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    return commitment_0;
  }
  _issueCapability_0(context, partialProofData, observedAt_0) {
    __compactRuntime.assert(this._equal_3(_descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 0 } },
                                                                                                     { idx: { cached: false,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_1.toValue(6n),
                                                                                                                                alignment: _descriptor_1.alignment() } }] } },
                                                                                                     { popeq: { cached: false,
                                                                                                                result: undefined } }]).value),
                                          1n),
                            'Request is not awaiting consent');
    __compactRuntime.assert(observedAt_0
                            <=
                            _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_1.toValue(5n),
                                                                                                                  alignment: _descriptor_1.alignment() } }] } },
                                                                                       { popeq: { cached: false,
                                                                                                  result: undefined } }]).value),
                            'Consent request has expired');
    const threshold_0 = this._privateThreshold_0(context, partialProofData);
    const credentialA_0 = this._privateCredentialA_0(context, partialProofData);
    const credentialB_0 = this._privateCredentialB_0(context, partialProofData);
    const credentialC_0 = this._privateCredentialC_0(context, partialProofData);
    __compactRuntime.assert(!this._equal_4(credentialA_0, credentialB_0)
                            &&
                            !this._equal_5(credentialA_0, credentialC_0)
                            &&
                            !this._equal_6(credentialB_0, credentialC_0),
                            'Consent credentials must be unique');
    const decisionA_0 = this._privateDecisionA_0(context, partialProofData);
    const decisionB_0 = this._privateDecisionB_0(context, partialProofData);
    const decisionC_0 = this._privateDecisionC_0(context, partialProofData);
    __compactRuntime.assert(decisionA_0 <= 1n && decisionB_0 <= 1n
                            &&
                            decisionC_0 <= 1n,
                            'Consent decisions must be binary');
    let t_0;
    __compactRuntime.assert((t_0 = decisionA_0 + decisionB_0 + decisionC_0,
                             t_0 >= threshold_0),
                            'Private consent policy is not satisfied');
    const expectedRequest_0 = this._requestCommitment_0(this._privateContentHash_0(context,
                                                                                   partialProofData),
                                                        this._privatePurposeHash_0(context,
                                                                                   partialProofData),
                                                        this._privatePolicySalt_0(context,
                                                                                  partialProofData),
                                                        threshold_0,
                                                        this._privateOrganizerSecret_0(context,
                                                                                       partialProofData),
                                                        this._privateRequestNonce_0(context,
                                                                                    partialProofData),
                                                        credentialA_0,
                                                        credentialB_0,
                                                        credentialC_0,
                                                        _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                                  partialProofData,
                                                                                                                  [
                                                                                                                   { dup: { n: 0 } },
                                                                                                                   { idx: { cached: false,
                                                                                                                            pushPath: false,
                                                                                                                            path: [
                                                                                                                                   { tag: 'value',
                                                                                                                                     value: { value: _descriptor_1.toValue(5n),
                                                                                                                                              alignment: _descriptor_1.alignment() } }] } },
                                                                                                                   { popeq: { cached: false,
                                                                                                                              result: undefined } }]).value));
    __compactRuntime.assert(this._equal_7(expectedRequest_0,
                                          _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 0 } },
                                                                                                     { idx: { cached: false,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_1.toValue(4n),
                                                                                                                                alignment: _descriptor_1.alignment() } }] } },
                                                                                                     { popeq: { cached: false,
                                                                                                                result: undefined } }]).value)),
                            'Private request data does not match the active commitment');
    const nullifier_0 = this._responseNullifier_0(this._privateRequestNonce_0(context,
                                                                              partialProofData),
                                                  credentialA_0,
                                                  credentialB_0,
                                                  credentialC_0);
    __compactRuntime.assert(!this._equal_8(nullifier_0,
                                           _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                     partialProofData,
                                                                                                     [
                                                                                                      { dup: { n: 0 } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_1.toValue(8n),
                                                                                                                                 alignment: _descriptor_1.alignment() } }] } },
                                                                                                      { popeq: { cached: false,
                                                                                                                 result: undefined } }]).value)),
                            'Consent responses were already used');
    const capability_0 = this._capabilityFor_0(_descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                         partialProofData,
                                                                                                         [
                                                                                                          { dup: { n: 0 } },
                                                                                                          { idx: { cached: false,
                                                                                                                   pushPath: false,
                                                                                                                   path: [
                                                                                                                          { tag: 'value',
                                                                                                                            value: { value: _descriptor_1.toValue(4n),
                                                                                                                                     alignment: _descriptor_1.alignment() } }] } },
                                                                                                          { popeq: { cached: false,
                                                                                                                     result: undefined } }]).value),
                                               this._privateContentHash_0(context,
                                                                          partialProofData),
                                               this._privatePurposeHash_0(context,
                                                                          partialProofData),
                                               this._privateCapabilitySecret_0(context,
                                                                               partialProofData));
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(8n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(nullifier_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(7n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(capability_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_0 = 2n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(6n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_1 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_1.toValue(1n),
                                                                  alignment: _descriptor_1.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_2.toValue(tmp_1),
                                                                alignment: _descriptor_2.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    return capability_0;
  }
  _consumeCapability_0(context, partialProofData, observedAt_0) {
    __compactRuntime.assert(this._equal_9(_descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 0 } },
                                                                                                     { idx: { cached: false,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_1.toValue(6n),
                                                                                                                                alignment: _descriptor_1.alignment() } }] } },
                                                                                                     { popeq: { cached: false,
                                                                                                                result: undefined } }]).value),
                                          2n),
                            'Capability is unavailable or already consumed');
    __compactRuntime.assert(observedAt_0
                            <=
                            _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_1.toValue(5n),
                                                                                                                  alignment: _descriptor_1.alignment() } }] } },
                                                                                       { popeq: { cached: false,
                                                                                                  result: undefined } }]).value),
                            'Capability has expired');
    const capability_0 = this._capabilityFor_0(_descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                         partialProofData,
                                                                                                         [
                                                                                                          { dup: { n: 0 } },
                                                                                                          { idx: { cached: false,
                                                                                                                   pushPath: false,
                                                                                                                   path: [
                                                                                                                          { tag: 'value',
                                                                                                                            value: { value: _descriptor_1.toValue(4n),
                                                                                                                                     alignment: _descriptor_1.alignment() } }] } },
                                                                                                          { popeq: { cached: false,
                                                                                                                     result: undefined } }]).value),
                                               this._privateContentHash_0(context,
                                                                          partialProofData),
                                               this._privatePurposeHash_0(context,
                                                                          partialProofData),
                                               this._privateCapabilitySecret_0(context,
                                                                               partialProofData));
    __compactRuntime.assert(this._equal_10(capability_0,
                                           _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                     partialProofData,
                                                                                                     [
                                                                                                      { dup: { n: 0 } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_1.toValue(7n),
                                                                                                                                 alignment: _descriptor_1.alignment() } }] } },
                                                                                                      { popeq: { cached: false,
                                                                                                                 result: undefined } }]).value)),
                            'Capability does not match this content and purpose');
    const tmp_0 = 4n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(6n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_1 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_1.toValue(2n),
                                                                  alignment: _descriptor_1.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_2.toValue(tmp_1),
                                                                alignment: _descriptor_2.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    return capability_0;
  }
  _revokeRequest_0(context, partialProofData) {
    __compactRuntime.assert(this._equal_11(_descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                     partialProofData,
                                                                                                     [
                                                                                                      { dup: { n: 0 } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_1.toValue(6n),
                                                                                                                                 alignment: _descriptor_1.alignment() } }] } },
                                                                                                      { popeq: { cached: false,
                                                                                                                 result: undefined } }]).value),
                                           1n)
                            ||
                            this._equal_12(_descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                     partialProofData,
                                                                                                     [
                                                                                                      { dup: { n: 0 } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_1.toValue(6n),
                                                                                                                                 alignment: _descriptor_1.alignment() } }] } },
                                                                                                      { popeq: { cached: false,
                                                                                                                 result: undefined } }]).value),
                                           2n),
                            'Request cannot be revoked');
    const expectedRequest_0 = this._requestCommitment_0(this._privateContentHash_0(context,
                                                                                   partialProofData),
                                                        this._privatePurposeHash_0(context,
                                                                                   partialProofData),
                                                        this._privatePolicySalt_0(context,
                                                                                  partialProofData),
                                                        this._privateThreshold_0(context,
                                                                                 partialProofData),
                                                        this._privateOrganizerSecret_0(context,
                                                                                       partialProofData),
                                                        this._privateRequestNonce_0(context,
                                                                                    partialProofData),
                                                        this._privateCredentialA_0(context,
                                                                                   partialProofData),
                                                        this._privateCredentialB_0(context,
                                                                                   partialProofData),
                                                        this._privateCredentialC_0(context,
                                                                                   partialProofData),
                                                        _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                                  partialProofData,
                                                                                                                  [
                                                                                                                   { dup: { n: 0 } },
                                                                                                                   { idx: { cached: false,
                                                                                                                            pushPath: false,
                                                                                                                            path: [
                                                                                                                                   { tag: 'value',
                                                                                                                                     value: { value: _descriptor_1.toValue(5n),
                                                                                                                                              alignment: _descriptor_1.alignment() } }] } },
                                                                                                                   { popeq: { cached: false,
                                                                                                                              result: undefined } }]).value));
    __compactRuntime.assert(this._equal_13(expectedRequest_0,
                                           _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                     partialProofData,
                                                                                                     [
                                                                                                      { dup: { n: 0 } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_1.toValue(4n),
                                                                                                                                 alignment: _descriptor_1.alignment() } }] } },
                                                                                                      { popeq: { cached: false,
                                                                                                                 result: undefined } }]).value)),
                            'Only the committed organizer can revoke');
    const tmp_0 = 3n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(6n),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_1 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_1.toValue(3n),
                                                                  alignment: _descriptor_1.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_2.toValue(tmp_1),
                                                                alignment: _descriptor_2.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_1.toValue(4n),
                                                                                                 alignment: _descriptor_1.alignment() } }] } },
                                                                      { popeq: { cached: false,
                                                                                 result: undefined } }]).value);
  }
  _requestCommitment_0(contentHash_0,
                       purposeHash_0,
                       policySalt_0,
                       threshold_0,
                       organizerSecret_0,
                       requestNonce_0,
                       credentialA_0,
                       credentialB_0,
                       credentialC_0,
                       expiry_0)
  {
    return this._persistentHash_0([new Uint8Array([118, 101, 105, 108, 45, 99, 111, 110, 115, 101, 110, 116, 58, 114, 101, 113, 117, 101, 115, 116, 58, 118, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                   contentHash_0,
                                   purposeHash_0,
                                   policySalt_0,
                                   __compactRuntime.convertFieldToBytes(32,
                                                                        threshold_0,
                                                                        'veil-consent.compact line 109 char 5'),
                                   organizerSecret_0,
                                   requestNonce_0,
                                   credentialA_0,
                                   credentialB_0,
                                   credentialC_0,
                                   __compactRuntime.convertFieldToBytes(32,
                                                                        expiry_0,
                                                                        'veil-consent.compact line 110 char 44')]);
  }
  _responseNullifier_0(requestNonce_0,
                       credentialA_0,
                       credentialB_0,
                       credentialC_0)
  {
    return this._persistentHash_1([new Uint8Array([118, 101, 105, 108, 45, 99, 111, 110, 115, 101, 110, 116, 58, 114, 101, 115, 112, 111, 110, 115, 101, 115, 58, 118, 49, 0, 0, 0, 0, 0, 0, 0]),
                                   requestNonce_0,
                                   credentialA_0,
                                   credentialB_0,
                                   credentialC_0]);
  }
  _capabilityFor_0(request_0, contentHash_0, purposeHash_0, secret_0) {
    return this._persistentHash_1([new Uint8Array([118, 101, 105, 108, 45, 99, 111, 110, 115, 101, 110, 116, 58, 99, 97, 112, 97, 98, 105, 108, 105, 116, 121, 58, 118, 49, 0, 0, 0, 0, 0, 0]),
                                   request_0,
                                   contentHash_0,
                                   purposeHash_0,
                                   secret_0]);
  }
  _equal_0(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_1(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_2(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_3(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_4(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_5(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_6(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_7(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_8(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_9(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_10(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_11(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_12(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_13(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()),
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    get requestsCreated() {
      return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_1.toValue(0n),
                                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get capabilitiesIssued() {
      return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_1.toValue(1n),
                                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get capabilitiesConsumed() {
      return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_1.toValue(2n),
                                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get revocations() {
      return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_1.toValue(3n),
                                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get activeRequest() {
      return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_1.toValue(4n),
                                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get activeExpiry() {
      return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_1.toValue(5n),
                                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get requestStatus() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_1.toValue(6n),
                                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get activeCapability() {
      return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_1.toValue(7n),
                                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get lastResponseNullifier() {
      return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_1.toValue(8n),
                                                                                                   alignment: _descriptor_1.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  privateContentHash: (...args) => undefined,
  privatePurposeHash: (...args) => undefined,
  privatePolicySalt: (...args) => undefined,
  privateThreshold: (...args) => undefined,
  privateOrganizerSecret: (...args) => undefined,
  privateRequestNonce: (...args) => undefined,
  privateCredentialA: (...args) => undefined,
  privateCredentialB: (...args) => undefined,
  privateCredentialC: (...args) => undefined,
  privateDecisionA: (...args) => undefined,
  privateDecisionB: (...args) => undefined,
  privateDecisionC: (...args) => undefined,
  privateCapabilitySecret: (...args) => undefined
});
export const pureCircuits = {
  requestCommitment: (...args_0) => {
    if (args_0.length !== 10) {
      throw new __compactRuntime.CompactError(`requestCommitment: expected 10 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const contentHash_0 = args_0[0];
    const purposeHash_0 = args_0[1];
    const policySalt_0 = args_0[2];
    const threshold_0 = args_0[3];
    const organizerSecret_0 = args_0[4];
    const requestNonce_0 = args_0[5];
    const credentialA_0 = args_0[6];
    const credentialB_0 = args_0[7];
    const credentialC_0 = args_0[8];
    const expiry_0 = args_0[9];
    if (!(contentHash_0.buffer instanceof ArrayBuffer && contentHash_0.BYTES_PER_ELEMENT === 1 && contentHash_0.length === 32)) {
      __compactRuntime.typeError('requestCommitment',
                                 'argument 1',
                                 'veil-consent.compact line 102 char 1',
                                 'Bytes<32>',
                                 contentHash_0)
    }
    if (!(purposeHash_0.buffer instanceof ArrayBuffer && purposeHash_0.BYTES_PER_ELEMENT === 1 && purposeHash_0.length === 32)) {
      __compactRuntime.typeError('requestCommitment',
                                 'argument 2',
                                 'veil-consent.compact line 102 char 1',
                                 'Bytes<32>',
                                 purposeHash_0)
    }
    if (!(policySalt_0.buffer instanceof ArrayBuffer && policySalt_0.BYTES_PER_ELEMENT === 1 && policySalt_0.length === 32)) {
      __compactRuntime.typeError('requestCommitment',
                                 'argument 3',
                                 'veil-consent.compact line 102 char 1',
                                 'Bytes<32>',
                                 policySalt_0)
    }
    if (!(typeof(threshold_0) === 'bigint' && threshold_0 >= 0n && threshold_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('requestCommitment',
                                 'argument 4',
                                 'veil-consent.compact line 102 char 1',
                                 'Uint<0..18446744073709551616>',
                                 threshold_0)
    }
    if (!(organizerSecret_0.buffer instanceof ArrayBuffer && organizerSecret_0.BYTES_PER_ELEMENT === 1 && organizerSecret_0.length === 32)) {
      __compactRuntime.typeError('requestCommitment',
                                 'argument 5',
                                 'veil-consent.compact line 102 char 1',
                                 'Bytes<32>',
                                 organizerSecret_0)
    }
    if (!(requestNonce_0.buffer instanceof ArrayBuffer && requestNonce_0.BYTES_PER_ELEMENT === 1 && requestNonce_0.length === 32)) {
      __compactRuntime.typeError('requestCommitment',
                                 'argument 6',
                                 'veil-consent.compact line 102 char 1',
                                 'Bytes<32>',
                                 requestNonce_0)
    }
    if (!(credentialA_0.buffer instanceof ArrayBuffer && credentialA_0.BYTES_PER_ELEMENT === 1 && credentialA_0.length === 32)) {
      __compactRuntime.typeError('requestCommitment',
                                 'argument 7',
                                 'veil-consent.compact line 102 char 1',
                                 'Bytes<32>',
                                 credentialA_0)
    }
    if (!(credentialB_0.buffer instanceof ArrayBuffer && credentialB_0.BYTES_PER_ELEMENT === 1 && credentialB_0.length === 32)) {
      __compactRuntime.typeError('requestCommitment',
                                 'argument 8',
                                 'veil-consent.compact line 102 char 1',
                                 'Bytes<32>',
                                 credentialB_0)
    }
    if (!(credentialC_0.buffer instanceof ArrayBuffer && credentialC_0.BYTES_PER_ELEMENT === 1 && credentialC_0.length === 32)) {
      __compactRuntime.typeError('requestCommitment',
                                 'argument 9',
                                 'veil-consent.compact line 102 char 1',
                                 'Bytes<32>',
                                 credentialC_0)
    }
    if (!(typeof(expiry_0) === 'bigint' && expiry_0 >= 0n && expiry_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('requestCommitment',
                                 'argument 10',
                                 'veil-consent.compact line 102 char 1',
                                 'Uint<0..18446744073709551616>',
                                 expiry_0)
    }
    return _dummyContract._requestCommitment_0(contentHash_0,
                                               purposeHash_0,
                                               policySalt_0,
                                               threshold_0,
                                               organizerSecret_0,
                                               requestNonce_0,
                                               credentialA_0,
                                               credentialB_0,
                                               credentialC_0,
                                               expiry_0);
  },
  responseNullifier: (...args_0) => {
    if (args_0.length !== 4) {
      throw new __compactRuntime.CompactError(`responseNullifier: expected 4 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const requestNonce_0 = args_0[0];
    const credentialA_0 = args_0[1];
    const credentialB_0 = args_0[2];
    const credentialC_0 = args_0[3];
    if (!(requestNonce_0.buffer instanceof ArrayBuffer && requestNonce_0.BYTES_PER_ELEMENT === 1 && requestNonce_0.length === 32)) {
      __compactRuntime.typeError('responseNullifier',
                                 'argument 1',
                                 'veil-consent.compact line 114 char 1',
                                 'Bytes<32>',
                                 requestNonce_0)
    }
    if (!(credentialA_0.buffer instanceof ArrayBuffer && credentialA_0.BYTES_PER_ELEMENT === 1 && credentialA_0.length === 32)) {
      __compactRuntime.typeError('responseNullifier',
                                 'argument 2',
                                 'veil-consent.compact line 114 char 1',
                                 'Bytes<32>',
                                 credentialA_0)
    }
    if (!(credentialB_0.buffer instanceof ArrayBuffer && credentialB_0.BYTES_PER_ELEMENT === 1 && credentialB_0.length === 32)) {
      __compactRuntime.typeError('responseNullifier',
                                 'argument 3',
                                 'veil-consent.compact line 114 char 1',
                                 'Bytes<32>',
                                 credentialB_0)
    }
    if (!(credentialC_0.buffer instanceof ArrayBuffer && credentialC_0.BYTES_PER_ELEMENT === 1 && credentialC_0.length === 32)) {
      __compactRuntime.typeError('responseNullifier',
                                 'argument 4',
                                 'veil-consent.compact line 114 char 1',
                                 'Bytes<32>',
                                 credentialC_0)
    }
    return _dummyContract._responseNullifier_0(requestNonce_0,
                                               credentialA_0,
                                               credentialB_0,
                                               credentialC_0);
  },
  capabilityFor: (...args_0) => {
    if (args_0.length !== 4) {
      throw new __compactRuntime.CompactError(`capabilityFor: expected 4 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const request_0 = args_0[0];
    const contentHash_0 = args_0[1];
    const purposeHash_0 = args_0[2];
    const secret_0 = args_0[3];
    if (!(request_0.buffer instanceof ArrayBuffer && request_0.BYTES_PER_ELEMENT === 1 && request_0.length === 32)) {
      __compactRuntime.typeError('capabilityFor',
                                 'argument 1',
                                 'veil-consent.compact line 122 char 1',
                                 'Bytes<32>',
                                 request_0)
    }
    if (!(contentHash_0.buffer instanceof ArrayBuffer && contentHash_0.BYTES_PER_ELEMENT === 1 && contentHash_0.length === 32)) {
      __compactRuntime.typeError('capabilityFor',
                                 'argument 2',
                                 'veil-consent.compact line 122 char 1',
                                 'Bytes<32>',
                                 contentHash_0)
    }
    if (!(purposeHash_0.buffer instanceof ArrayBuffer && purposeHash_0.BYTES_PER_ELEMENT === 1 && purposeHash_0.length === 32)) {
      __compactRuntime.typeError('capabilityFor',
                                 'argument 3',
                                 'veil-consent.compact line 122 char 1',
                                 'Bytes<32>',
                                 purposeHash_0)
    }
    if (!(secret_0.buffer instanceof ArrayBuffer && secret_0.BYTES_PER_ELEMENT === 1 && secret_0.length === 32)) {
      __compactRuntime.typeError('capabilityFor',
                                 'argument 4',
                                 'veil-consent.compact line 122 char 1',
                                 'Bytes<32>',
                                 secret_0)
    }
    return _dummyContract._capabilityFor_0(request_0,
                                           contentHash_0,
                                           purposeHash_0,
                                           secret_0);
  }
};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map
