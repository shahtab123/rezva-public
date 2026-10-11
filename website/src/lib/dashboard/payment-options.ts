export type DashboardPaymentOption = {
  chain: string;
  asset: string;
  address: string;
  token_contract?: string;
  network_identifier?: string;
};

export type PaymentNetworkOption = {
  id: string;
  label: string;
  network_identifier: string;
  assets: Array<{
    symbol: string;
    label: string;
    /** Empty string means native gas token (no ERC-20 contract). */
    token_contract: string;
  }>;
};

/** Supported networks + assets for the business / provider dashboards. */
export const PAYMENT_NETWORKS: PaymentNetworkOption[] = [
  {
    id: "base-sepolia",
    label: "Base Sepolia (testnet)",
    network_identifier: "eip155:84532",
    assets: [
      {
        symbol: "USDC",
        label: "USDC",
        token_contract: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      },
      {
        symbol: "EURC",
        label: "EURC",
        token_contract: "0x808456652fdb597867f38412077A9182bf77359F",
      },
      {
        symbol: "ETH",
        label: "ETH (native)",
        token_contract: "",
      },
    ],
  },
  {
    id: "base",
    label: "Base",
    network_identifier: "eip155:8453",
    assets: [
      {
        symbol: "USDC",
        label: "USDC",
        token_contract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      },
      {
        symbol: "USDT",
        label: "USDT",
        token_contract: "0xfde4C96c8593536E31F7877A73b3b2787b8D8C9a",
      },
      {
        symbol: "DAI",
        label: "DAI",
        token_contract: "0x50c5725949A6F0c72E6C4a641F24049A917B0DDc",
      },
      {
        symbol: "EURC",
        label: "EURC",
        token_contract: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
      },
      {
        symbol: "ETH",
        label: "ETH (native)",
        token_contract: "",
      },
    ],
  },
  {
    id: "ethereum",
    label: "Ethereum",
    network_identifier: "eip155:1",
    assets: [
      {
        symbol: "USDC",
        label: "USDC",
        token_contract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      },
      {
        symbol: "USDT",
        label: "USDT",
        token_contract: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      },
      {
        symbol: "DAI",
        label: "DAI",
        token_contract: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      },
      {
        symbol: "EURC",
        label: "EURC",
        token_contract: "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c",
      },
      {
        symbol: "ETH",
        label: "ETH (native)",
        token_contract: "",
      },
    ],
  },
];

export const DEFAULT_PAYMENT_NETWORK = PAYMENT_NETWORKS[0]!;
export const DEFAULT_PAYMENT_ASSET = DEFAULT_PAYMENT_NETWORK.assets[0]!;

/** @deprecated Prefer DEFAULT_PAYMENT_NETWORK / DEFAULT_PAYMENT_ASSET */
export const BASE_SEPOLIA_USDC = {
  chain: DEFAULT_PAYMENT_NETWORK.id,
  asset: DEFAULT_PAYMENT_ASSET.symbol,
  network_identifier: DEFAULT_PAYMENT_NETWORK.network_identifier,
  token_contract: DEFAULT_PAYMENT_ASSET.token_contract,
} as const;

export function getPaymentNetwork(chainId: string): PaymentNetworkOption | undefined {
  return PAYMENT_NETWORKS.find((network) => network.id === chainId);
}

export function getPaymentAsset(chainId: string, symbol: string) {
  const network = getPaymentNetwork(chainId);
  return network?.assets.find(
    (asset) => asset.symbol.toUpperCase() === symbol.trim().toUpperCase(),
  );
}

export function resolvePaymentSelection(
  chainId: string,
  assetSymbol: string,
): {
  chain: string;
  asset: string;
  network_identifier: string;
  token_contract?: string;
} | null {
  const network = getPaymentNetwork(chainId);
  if (!network) return null;
  const asset =
    getPaymentAsset(chainId, assetSymbol) ??
    network.assets[0] ??
    null;
  if (!asset) return null;
  return {
    chain: network.id,
    asset: asset.symbol,
    network_identifier: network.network_identifier,
    ...(asset.token_contract ? { token_contract: asset.token_contract } : {}),
  };
}

export function presetForChainAsset(
  chain: string,
  asset: string,
): { network_identifier?: string; token_contract?: string } {
  const resolved = resolvePaymentSelection(chain, asset);
  if (!resolved) return {};
  return {
    network_identifier: resolved.network_identifier,
    ...(resolved.token_contract ? { token_contract: resolved.token_contract } : {}),
  };
}

export function normalizePaymentOption(
  option: DashboardPaymentOption,
): DashboardPaymentOption | null {
  const chain = option.chain?.trim() ?? "";
  const asset = option.asset?.trim() ?? "";
  const address = option.address?.trim() ?? "";
  if (!chain || !asset || !address) return null;

  const preset = presetForChainAsset(chain, asset);
  const network_identifier =
    option.network_identifier?.trim() || preset.network_identifier || undefined;
  const token_contract =
    option.token_contract?.trim() || preset.token_contract || undefined;

  return {
    chain,
    asset,
    address,
    ...(network_identifier ? { network_identifier } : {}),
    ...(token_contract ? { token_contract } : {}),
  };
}
