import fs from 'node:fs';
import path from 'node:path';

import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';

import { VeilConsent } from './contract';
import { resolveNetwork } from './network';

interface PublishedDeployment {
  network: string;
  address: string;
  lifecycleBlock: number;
  transactions: Record<'create' | 'issue' | 'consume', string>;
}

async function main(): Promise<void> {
  const { network, config } = resolveNetwork();
  const recordPath = path.resolve('deployments', `${network}.json`);
  if (!fs.existsSync(recordPath)) throw new Error(`No published deployment record for ${network}`);
  const deployment = JSON.parse(fs.readFileSync(recordPath, 'utf8')) as PublishedDeployment;
  const provider = indexerPublicDataProvider(config.indexer, config.indexerWS);
  const state = await provider.queryContractState(deployment.address);
  if (!state) throw new Error(`Contract ${deployment.address} was not returned by the ${network} indexer`);

  const ledger = VeilConsent.ledger(state.data);
  const status = Number(ledger.requestStatus);
  if (status !== 4) throw new Error(`Expected consumed status 4, received ${status}`);

  console.log(`VeilConsent · verified on ${network}`);
  console.log(`Contract: ${deployment.address}`);
  console.log(`Status:   ${status} (consumed)`);
  console.log(`Requests: ${Number(ledger.requestsCreated)}`);
  console.log(`Issued:   ${Number(ledger.capabilitiesIssued)}`);
  console.log(`Consumed: ${Number(ledger.capabilitiesConsumed)}`);
  console.log(`Evidence block: ${deployment.lifecycleBlock}`);
  console.log(`Create tx:  ${deployment.transactions.create}`);
  console.log(`Issue tx:   ${deployment.transactions.issue}`);
  console.log(`Consume tx: ${deployment.transactions.consume}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
