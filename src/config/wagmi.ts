import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { baseAccount } from 'wagmi/connectors';
// Note: CDP Embedded Wallets are handled via CDPReactProvider, not Wagmi connectors

// Base Account Configuration  
const baseAccountConnector = baseAccount({
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Your App',
});

// Wagmi Configuration (Base Account only - embedded wallets via CDP React providers)
export const wagmiConfig = createConfig({
  connectors: [baseAccountConnector],
  chains: [baseSepolia], // Base Sepolia only for showcase
  transports: {
    [baseSepolia.id]: http(),
  },
});
