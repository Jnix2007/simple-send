import { useState } from 'react';
import { useAccount } from 'wagmi';

export function FaucetComponent() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');

  const requestFaucetFunds = async (token: 'eth' | 'usdc') => {
    if (!address) return;

    setIsLoading(true);
    setError('');

    try {
      console.log(`🚰 Requesting ${token.toUpperCase()} from faucet for:`, address);
      
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          network: 'base-sepolia',
          token
        })
      });

      if (!response.ok) {
        throw new Error(`Faucet request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setLastTxHash(result.transactionHash);
        console.log(`✅ ${token.toUpperCase()} faucet successful:`, result.transactionHash);
      } else {
        throw new Error(result.error || 'Faucet request failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Faucet request failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddress = async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      console.log('📋 Address copied to clipboard');
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  if (!address) {
    return (
      <div className="text-center p-6 text-gray-500">
        Connect your wallet to use the faucet
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold mb-2">🚰 Testnet Faucet</h3>
        <p className="text-sm text-gray-600 mb-4">
          Get free testnet tokens to test transactions
        </p>
        
        {/* Address with copy button */}
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded border">
          <code className="flex-1 text-sm font-mono text-gray-800">
            {address.slice(0, 6)}...{address.slice(-4)}
          </code>
          <button
            onClick={copyAddress}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            title="Copy full address"
          >
            📋 Copy
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-800">Error: {error}</p>
        </div>
      )}

      {lastTxHash && (
        <div className="p-3 mb-4 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-800 font-medium mb-1">✅ Faucet Success!</p>
          <a
            href={`https://sepolia.basescan.org/tx/${lastTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-xs underline"
          >
            View on Basescan →
          </a>
        </div>
      )}

      <div className="space-y-3">
        <div className="text-sm text-gray-600 mb-3">
          <strong>Available Tokens:</strong>
          <ul className="mt-1 ml-4">
            <li>• ETH: 0.0001 per request (1000 claims/24h)</li>
            <li>• USDC: Test amount per request</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => requestFaucetFunds('eth')}
            disabled={isLoading}
            className="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Claiming...' : 'Claim ETH'}
          </button>
          
          <button
            onClick={() => requestFaucetFunds('usdc')}
            disabled={isLoading}
            className="px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Claiming...' : 'Claim USDC'}
          </button>
        </div>

        <div className="text-xs text-gray-500 text-center mt-4">
          Testnet tokens have no real value and are only for testing
        </div>
      </div>
    </div>
  );
}
