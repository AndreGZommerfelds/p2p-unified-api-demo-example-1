import axios  from 'axios';
import { SeiSigner } from '../../src/sei';
import * as dotenv from 'dotenv'

dotenv.config();

async function main() {
    const config = {
        seiNodeRpc: process.env.SEI_RPC_NODE,
        p2pApiUrl: process.env.P2P_API_URL,
        p2pApiKey: process.env.P2P_API_KEY,
        networkName: process.env.SEI_NETWORK_NAME,
        seiAddress: process.env.SEI_ADDRESS,
        seiMnemonic: process.env.SEI_MNEMONIC
    };

    const options = {
        method: 'POST',
        url: `${config.p2pApiUrl}/api/v1/sei/${config.networkName}/staking/redeligate-to`,
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: `Bearer ${config.p2pApiKey}`
        },
        data: { stashAccountAddress: config.seiAddress, amount: 0.1 }
    };

    const data = await axios.request(options);

    const signer = new SeiSigner(config);
    console.log(await signer.signAndBroadcast(data.data.result.transactionData));

}

main();