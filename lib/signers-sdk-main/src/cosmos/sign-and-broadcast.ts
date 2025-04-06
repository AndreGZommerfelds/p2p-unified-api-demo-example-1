import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import {
  MsgDelegate,
  MsgUndelegate,
  MsgBeginRedelegate,
} from 'cosmjs-types/cosmos/staking/v1beta1/tx';
import { MsgWithdrawDelegatorReward } from 'cosmjs-types/cosmos/distribution/v1beta1/tx';
import { format } from 'util';
import axios from 'axios';

const cosmosBroadcastUrl = '/api/v1/cosmos/%s/transaction/send';

export interface TransactionMeta {
  amount: number;
  currency: string;
  delegatorAddress: string;
  createdAt: Date;
}

export interface Transaction<TMeta extends object = TransactionMeta> {
  data: CosmosTransactionData;
  meta: TMeta;
}

export interface TransactionFee {
  amount: {
    denom: string;
    amount: string;
  }[];
  gas: string;
}

export interface CosmosTransactionData {
  delegatorAddress: string;
  messages: Message[];
  fee: TransactionFee;
  memo?: string;
}

export type MessageTypes =
  | MsgDelegate
  | MsgUndelegate
  | MsgBeginRedelegate
  | MsgWithdrawDelegatorReward;

export interface Message<T extends MessageTypes = MessageTypes> {
  typeUrl: string;
  value: T;
}

const ADDRESS_PATTERN = /^cosmos1[a-z0-9]{38}$/;
const MNEMONIC_PATTERN = /^(([a-z]+ ){11}|([a-z]+ ){23})[a-z]+$/;
export enum CosmosNetworks {
  MAINNET = 'cosmoshub-4',
  TESTNET = 'theta-testnet-001',
}

export interface CosmosConfig {
  cosmosNodeRpc: string;
  p2pApiUrl: string;
  p2pApiKey: string;
  networkName: string;
  cosmosAddress: string;
  cosmosMnemonic: string;
}

export class CosmosSigner {
  private client?: SigningCosmWasmClient;
  protected wallet?: DirectSecp256k1HdWallet;
  protected initRun?: Promise<{
    client: SigningCosmWasmClient;
    wallet: DirectSecp256k1HdWallet;
  }>;
  constructor(private config: CosmosConfig) {
    this.configValidation(config);
  }

  private configValidation(config: CosmosConfig): boolean {
    const errors: string[] = [];

    function isValidUrl(url: string): boolean {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    }

    if (!isValidUrl(config.cosmosNodeRpc)) {
      errors.push('Invalid Cosmos Node RPC URL');
    }
    if (!isValidUrl(config.p2pApiUrl)) {
      errors.push('Invalid P2P API URL');
    }
    if (typeof config.p2pApiKey !== 'string' || config.p2pApiKey.length < 5) {
      errors.push('Invalid P2P API key');
    }

    if (!Object.values(CosmosNetworks).map(String).includes(config.networkName)) {
      errors.push('Invalid network ID');
    }

    if (!ADDRESS_PATTERN.test(config.cosmosAddress)) {
      errors.push('Invalid Cosmos address');
    }

    if (!MNEMONIC_PATTERN.test(config.cosmosMnemonic)) {
      errors.push('Invalid Cosmos mnemonic');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed: ${errors.join('; ')}`);
    }

    return true;
  }

  async init(): Promise<void> {
    if (!this.initRun) {
      this.initRun = CosmosSigner.prepareClient(this.config);
      const { client, wallet } = await this.initRun;
      this.client = client;
      this.wallet = wallet;
    } else {
      await this.initRun;
    }
  }

  private static async prepareClient(config: CosmosConfig): Promise<{
    client: SigningCosmWasmClient;
    wallet: DirectSecp256k1HdWallet;
  }> {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(config.cosmosMnemonic);
    const client = await SigningCosmWasmClient.connectWithSigner(config.cosmosNodeRpc, wallet);
    return { client, wallet };
  }

  async info(): Promise<{
    address: string;
    networkName: string;
  }> {
    return {
      address: this.config.cosmosAddress,
      networkName: this.config.networkName,
    };
  }

  async sign(data: CosmosTransactionData): Promise<string> {
    if (!(this.client instanceof SigningCosmWasmClient)) {
      await this.init();
    }
    const signedTx = await (this.client as SigningCosmWasmClient).sign(
      this.config.cosmosAddress,
      data.messages,
      data.fee,
      data.memo || ''
    );
    return Array.from(TxRaw.encode(signedTx).finish())
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  async broadcast(signedTransaction: string): Promise<string> {
    if (!this.client) {
      await this.init();
    }
    const res = await axios.post(
      this.config.p2pApiUrl + format(cosmosBroadcastUrl, this.config.networkName),
      {
        signedTransaction,
      },
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${this.config.p2pApiKey}`,
        },
      }
    );
    return res.data.result?.transactionHash;
  }

  async signAndBroadcast(data: CosmosTransactionData): Promise<string> {
    return this.broadcast(await this.sign(data));
  }
}
