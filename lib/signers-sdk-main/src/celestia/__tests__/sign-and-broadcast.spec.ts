const mockClient = {
    sign: jest.fn().mockReturnValue({ bodyBytes: new Uint8Array([8, 8]), authInfoBytes: new Uint8Array([8, 8]), signatures: [new Uint8Array([8, 8])] }),
} as unknown as SigningCosmWasmClient;

const  mockWallet = {} as DirectSecp256k1HdWallet;

import { CelestiaSigner, CelestiaConfig, CelestiaTransactionData } from '../sign-and-broadcast';
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import axios from "axios";

jest.mock('axios');



describe('CelestiaSigner', () => {
    jest.mock("@cosmjs/cosmwasm-stargate", () => ({
        SigningCosmWasmClient: jest.fn().mockImplementation(() => {
            return {
                connectWithSigner: jest.fn().mockReturnValue(mockClient),
            };
        })
    }));

    jest.mock("@cosmjs/proto-signing", () => ({
        DirectSecp256k1HdWallet: {
            fromMnemonic: jest.fn().mockReturnValue(mockWallet),
        }
    }));

    jest.mock("axios");
    const mockConfig: CelestiaConfig = {
        celestiaNodeRpc: 'http://localhost:26657',
        p2pApiUrl: 'http://localhost:3000',
        p2pApiKey: 'test-api-key',
        networkName: 'celestia-mainnet-beta',
        celestiaAddress: 'celestia1abcdef1234567890abcdef1234567890abcdef1',
        celestiaMnemonic: 'valid twelve words mnemonic should be here and i hope it is'
    };

    let signer: CelestiaSigner;

    beforeEach(() => {
        signer = new CelestiaSigner(mockConfig);

        DirectSecp256k1HdWallet.fromMnemonic = jest.fn().mockReturnValue(mockWallet);
        SigningCosmWasmClient.connectWithSigner  = jest.fn().mockReturnValue(mockClient);
        (axios.post as jest.Mock).mockResolvedValue({ data: { result: { transactionHash: 'test-hash' } } });
    });

    it('should initialize the CelestiaSigner correctly', async () => {
        await signer.init();
        expect(SigningCosmWasmClient.connectWithSigner).toHaveBeenCalledWith(mockConfig.celestiaNodeRpc, mockWallet);
    });

    it('should return the correct info', async () => {
        const info = await signer.info();
        expect(info).toEqual({
            address: mockConfig.celestiaAddress,
            networkName: mockConfig.networkName,
        });
    });

    describe('CelestiaSigner Configuration Validation', () => {
        const validConfig: CelestiaConfig = mockConfig;

        it('should validate a correct config without throwing an error', () => {
            expect(() => new CelestiaSigner(validConfig)).not.toThrow();
        });

        it('should throw an error for an invalid Celestia Node RPC URL', () => {
            const invalidConfig = { ...validConfig, celestiaNodeRpc: 'invalid-url' };
            expect(() => new CelestiaSigner(invalidConfig)).toThrow('Invalid Celestia Node RPC URL');
        });

        it('should throw an error for an invalid P2P API URL', () => {
            const invalidConfig = { ...validConfig, p2pApiUrl: 'invalid-url' };
            expect(() => new CelestiaSigner(invalidConfig)).toThrow('Invalid P2P API URL');
        });

        it('should throw an error for an invalid P2P API key', () => {
            const invalidConfig = { ...validConfig, p2pApiKey: 'key' };
            expect(() => new CelestiaSigner(invalidConfig)).toThrow('Invalid P2P API key');
        });

        it('should throw an error for an invalid network ID', () => {
            const invalidConfig = { ...validConfig, networkId: 'invalid-network' };
            expect(() => new CelestiaSigner(invalidConfig)).toThrow('Invalid network ID');
        });

        it('should throw an error for an invalid Celestia address', () => {
            const invalidConfig = { ...validConfig, celestiaAddress: 'invalid-address' };
            expect(() => new CelestiaSigner(invalidConfig)).toThrow('Invalid Celestia address');
        });

        it('should throw an error for an invalid Celestia mnemonic', () => {
            const invalidConfig = { ...validConfig, celestiaMnemonic: 'invalid mnemonic' };
            expect(() => new CelestiaSigner(invalidConfig)).toThrow('Invalid Celestia mnemonic');
        });

        it('should accumulate multiple errors in the validation exception', () => {
            const invalidConfig = {
                ...validConfig,
                celestiaNodeRpc: 'invalid-url',
                p2pApiUrl: 'invalid-url',
                celestiaAddress: 'invalid-address',
            };
            expect(() => new CelestiaSigner(invalidConfig)).toThrow(
              /Invalid Celestia Node RPC URL; Invalid P2P API URL; Invalid Celestia address/
            );
        });
    });

    it('should sign a transaction', async () => {
        const data: CelestiaTransactionData = {
            stashAccountAddress: 'stash-account',
            messages: [],
            fee: { amount: [], gas: '200' },
        };

        const signedTx = await signer.sign(data);
        expect(signedTx).toBeDefined();
        expect(mockClient.sign).toHaveBeenCalledWith(mockConfig.celestiaAddress, data.messages, data.fee, '');
    });

    it('should broadcast a signed transaction', async () => {
        const signedTx = "signed_transaction_data";

        const txHash = await signer.broadcast(signedTx);
        expect(txHash).toBe('test-hash');
        expect(axios.post).toHaveBeenCalledWith(
          `${mockConfig.p2pApiUrl}/api/v1/celestia/${mockConfig.networkName}/staking/stake`,
          {
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + mockConfig.p2pApiKey,
              },
              data: {
                  signedTransaction: signedTx,
              }
          }
        );
    });

    it('should sign and broadcast a transaction', async () => {
        const transaction: CelestiaTransactionData = {
            stashAccountAddress: 'stash-account',
            messages: [],
            fee: { amount: [], gas: '200' }
        };

        jest.spyOn(signer, 'sign').mockResolvedValue("signed_tx_data");
        jest.spyOn(signer, 'broadcast').mockResolvedValue("txhash");

        const hash = await signer.signAndBroadcast(transaction);
        expect(hash).toBe('txhash');
        expect(signer.sign).toHaveBeenCalledWith(transaction);
        expect(signer.broadcast).toHaveBeenCalledWith("signed_tx_data");
    });
});