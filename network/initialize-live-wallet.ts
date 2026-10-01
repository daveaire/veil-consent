import fs from 'node:fs';

import { getOrCreateWallet, recordDeployment } from './network';
import { deriveUnshieldedAddress } from './wallet';

const network = 'preprod' as const;
const published = JSON.parse(
  fs.readFileSync(new URL('../deployments/preprod.json', import.meta.url), 'utf8'),
) as { address: string; deployer: string };

const wallet = getOrCreateWallet(network);
recordDeployment(network, published.address, published.deployer);

console.log(`Network: ${network}`);
console.log(`Address: ${deriveUnshieldedAddress(network, wallet.seed)}`);
console.log(`Contract: ${published.address}`);
console.log(wallet.created
  ? 'A dedicated owner-only recovery record was created in .midnight-state.json.'
  : 'The existing dedicated operations wallet was retained.');
