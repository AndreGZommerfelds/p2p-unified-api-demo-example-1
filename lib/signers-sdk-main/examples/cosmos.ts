import axios  from 'axios';
import { CosmosSigner } from '../src/cosmos';
import * as dotenv from 'dotenv'

dotenv.config();

async function main() {
    const config = {
        cosmosNodeRpc: process.env.COSMOS_RPC_NODE,
        p2pApiUrl: process.env.P2P_API_URL,
        p2pApiKey: process.env.P2P_API_KEY,
        networkName: process.env.COSMOS_NETWORK_NAME,
        cosmosAddress: process.env.COSMOS_ADDRESS,
        cosmosMnemonic: process.env.COSMOS_MNEMONIC
    };

    const options = {
        method: 'POST',
        url: `${config.p2pApiUrl}/api/v1/cosmos/${config.networkName}/staking/stake`,
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: `Bearer ${config.p2pApiKey}`
        },
        data: { stashAccountAddress: config.cosmosAddress, amount: 0.1 }
    };

    const data = await axios.request(options);

    const signer = new CosmosSigner(config);
    console.log(await signer.signAndBroadcast(data.data.result.transactionData));
}

main();