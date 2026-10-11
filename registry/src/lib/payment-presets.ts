/** Maps stored chain + asset to wallet-facing payment fields. */

type NetworkMeta = {
  chain: string;
  network_identifier: string;
};

type TokenMeta = {
  token_contract?: string;
};

const NETWORKS: Record<string, NetworkMeta> = {
  "base-sepolia": { chain: "base", network_identifier: "eip155:84532" },
  base: { chain: "base", network_identifier: "eip155:8453" },
  ethereum: { chain: "ethereum", network_identifier: "eip155:1" },
};

const TOKENS: Record<string, Record<string, TokenMeta>> = {
  "base-sepolia": {
    USDC: { token_contract: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" },
    EURC: { token_contract: "0x808456652fdb597867f38412077A9182bf77359F" },
    ETH: {},
  },
  base: {
    USDC: { token_contract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
    USDT: { token_contract: "0xfde4C96c8593536E31F7877A73b3b2787b8D8C9a" },
    DAI: { token_contract: "0x50c5725949A6F0c72E6C4a641F24049A917B0Dc" },
    EURC: { token_contract: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42" },
    ETH: {},
  },
  ethereum: {
    USDC: { token_contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    USDT: { token_contract: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
    DAI: { token_contract: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
    EURC: { token_contract: "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c" },
    ETH: {},
  },
};

export function enrichPaymentOption(input: {
  chain: string;
  asset: string;
  address: string;
}): {
  chain: string;
  asset: string;
  address: string;
  payment_ready: true;
  network_identifier?: string;
  token_contract?: string;
} {
  const networkKey = input.chain.toLowerCase();
  const assetKey = input.asset.toUpperCase();
  const network = NETWORKS[networkKey];
  const token = TOKENS[networkKey]?.[assetKey];
  return {
    chain: network?.chain ?? input.chain,
    asset: input.asset,
    address: input.address,
    payment_ready: true,
    ...(network?.network_identifier
      ? { network_identifier: network.network_identifier }
      : {}),
    ...(token?.token_contract ? { token_contract: token.token_contract } : {}),
  };
}
