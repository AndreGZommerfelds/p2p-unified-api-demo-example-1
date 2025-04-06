import axios  from 'axios';
import { CelestiaSigner } from '../../src/celestia';
import * as dotenv from 'dotenv'

dotenv.config();

async function main() {
    try {
        const config = {
            celestiaNodeRpc: process.env.CELESTIA_RPC_NODE,
            p2pApiUrl: process.env.P2P_API_URL,
            p2pApiKey: process.env.P2P_API_KEY,
            networkName: process.env.CELESTIA_NETWORK_NAME,
            celestiaAddress: process.env.CELESTIA_ADDRESS,
            celestiaMnemonic: process.env.CELESTIA_MNEMONIC
        };

        const options = {
            method: 'POST',
            url: `${config.p2pApiUrl}/api/v1/celestia/${config.networkName}/staking/stake`,
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                authorization: `Bearer ${config.p2pApiKey}`
            },
            data: { stashAccountAddress: config.celestiaAddress, amount: 0.1 }
        };

        const data = await axios.request(options);

        const signer = new CelestiaSigner(config);
        console.log(await signer.signAndBroadcast(data.data.result.transactionData));
    } catch (error) {
        console.log(error, (error as any)?.response.data.error.errors)
    }
}

main();