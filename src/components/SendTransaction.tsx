import { useState, useEffect } from 'react';
import { parseEther, parseUnits, encodeFunctionData } from 'viem';
import { useSendTransaction, useWaitForTransactionReceipt, useAccount, useSwitchChain } from 'wagmi';
import { useSendEvmTransaction } from '@coinbase/cdp-hooks';
import { baseSepolia } from 'wagmi/chains';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';

// USDC contract address on Base Sepolia
const USDC_CONTRACT_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Need to verify this address

export function SendTransaction() {
  const { address, walletType } = useUnifiedAuth();
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState<string>('');
  const [isResolving, setIsResolving] = useState(false);
  const [token, setToken] = useState<'ETH' | 'USDC'>('ETH');

  // Wagmi transaction for Base Account
  const { data: wagmiHash, sendTransaction: wagmiSendTransaction, isPending: wagmiPending, error: wagmiError } = useSendTransaction();
  const { isLoading: wagmiConfirming, isSuccess: wagmiSuccess } = useWaitForTransactionReceipt({ hash: wagmiHash });
  
  // CDP transaction for Embedded Wallet
  const { sendEvmTransaction } = useSendEvmTransaction();
  
  // Unified transaction state
  const [cdpTxHash, setCdpTxHash] = useState<string>('');
  const [cdpTxStatus, setCdpTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [cdpError, setCdpError] = useState<string>('');
  
  // Determine which system to use based on wallet type
  const isPending = walletType === 'base_account' ? wagmiPending : cdpTxStatus === 'pending';
  const isConfirming = walletType === 'base_account' ? wagmiConfirming : false;
  const isSuccess = walletType === 'base_account' ? wagmiSuccess : cdpTxStatus === 'success';
  const error = walletType === 'base_account' ? wagmiError : (cdpError ? { message: cdpError } : null);
  const hash = walletType === 'base_account' ? wagmiHash : cdpTxHash;
  
  // Address resolution with proper ENS and Basename support
  useEffect(() => {
    const resolveAddress = async () => {
      console.log('🔍 Starting resolution for:', recipient);
      
      if (!recipient) {
        setResolvedAddress('');
        setIsResolving(false);
        return;
      }

      // If it's already a valid address, no resolution needed
      if (recipient.startsWith('0x') && recipient.length === 42) {
        setResolvedAddress(recipient);
        setIsResolving(false);
        return;
      }

      // Handle ENS names and Basenames
      if (recipient.endsWith('.eth') || recipient.endsWith('.base')) {
        setIsResolving(true);
        
        try {
          // Normalize basename format for ENS resolution
          const normalizedName = recipient.endsWith('.base') 
            ? `${recipient}.eth` 
            : recipient;
          
          console.log('🔍 Resolving via ENS API:', normalizedName);
          
          // Use public ENS API
          const response = await fetch(`https://api.ensdata.net/${normalizedName}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.address) {
              setResolvedAddress(data.address);
              console.log('✅ Resolved', recipient, 'to', data.address);
            } else {
              setResolvedAddress('NOT_FOUND');
              console.log('❌ Name not found:', recipient);
            }
          } else {
            setResolvedAddress('NOT_FOUND');
            console.log('❌ ENS API failed for:', recipient);
          }
        } catch (error) {
          console.error('❌ Resolution failed:', error);
          setResolvedAddress('NOT_FOUND');
        } finally {
          setIsResolving(false);
        }
        
        return;
      }

      // Clear for other inputs
      setResolvedAddress('');
      setIsResolving(false);
    };

    const debounceTimer = setTimeout(resolveAddress, 300);
    return () => clearTimeout(debounceTimer);
  }, [recipient]);

  const handleTransaction = async () => {
    const targetAddress = resolvedAddress || recipient;
    if (!address || !amount || !targetAddress) return;
    
    try {
      if (walletType === 'base_account') {
        // Use Wagmi for Base Account transactions
        if (token === 'ETH') {
          wagmiSendTransaction({
            to: targetAddress as `0x${string}`,
            value: parseEther(amount),
          });
        } else if (token === 'USDC') {
          // ERC-20 USDC transfer via Wagmi
          const usdcAmount = parseUnits(amount, 6); // USDC has 6 decimals
          const transferData = encodeFunctionData({
            abi: [
              {
                name: 'transfer',
                type: 'function',
                inputs: [
                  { name: 'to', type: 'address' },
                  { name: 'amount', type: 'uint256' }
                ],
                outputs: [{ name: '', type: 'bool' }],
                stateMutability: 'nonpayable'
              }
            ],
            functionName: 'transfer',
            args: [targetAddress as `0x${string}`, usdcAmount]
          });

          wagmiSendTransaction({
            to: USDC_CONTRACT_ADDRESS as `0x${string}`,
            data: transferData,
          });
        }
      } else if (walletType === 'embedded') {
        // Use CDP for Embedded Wallet transactions
        setCdpTxStatus('pending');
        setCdpError('');
        
        if (token === 'ETH') {
          const result = await sendEvmTransaction({
            transaction: {
              to: targetAddress as `0x${string}`,
              value: parseEther(amount),
              gas: 21000n,
              chainId: 84532, // Base Sepolia
              type: "eip1559",
            },
            evmAccount: address as `0x${string}`,
            network: "base-sepolia",
          });
          
          setCdpTxHash(result.transactionHash);
          setCdpTxStatus('success');
          console.log('✅ CDP ETH transaction:', result.transactionHash);
          
        } else if (token === 'USDC') {
          // CDP handles USDC transfers automatically
          const usdcAmount = parseUnits(amount, 6); // USDC has 6 decimals
          console.log(`💰 Sending ${amount} USDC (${usdcAmount.toString()} smallest units) to ${targetAddress}`);
          
          const result = await sendEvmTransaction({
            transaction: {
              to: USDC_CONTRACT_ADDRESS as `0x${string}`,
              data: encodeFunctionData({
                abi: [
                  {
                    name: 'transfer',
                    type: 'function',
                    inputs: [
                      { name: 'to', type: 'address' },
                      { name: 'amount', type: 'uint256' }
                    ],
                    outputs: [{ name: '', type: 'bool' }],
                    stateMutability: 'nonpayable'
                  }
                ],
                functionName: 'transfer',
                args: [targetAddress as `0x${string}`, usdcAmount]
              }),
              gas: 70000n, // Increased gas limit for ERC-20 transfers
              chainId: 84532, // Base Sepolia
              type: "eip1559",
            },
            evmAccount: address as `0x${string}`,
            network: "base-sepolia",
          });
          
          setCdpTxHash(result.transactionHash);
          setCdpTxStatus('success');
          console.log('✅ CDP USDC transaction:', result.transactionHash);
        }
      }
    } catch (error) {
      console.error('❌ Transaction failed:', error);
      if (walletType === 'embedded') {
        setCdpError(error instanceof Error ? error.message : 'Transaction failed');
        setCdpTxStatus('error');
      }
    }
  };

  const getTransactionGuidance = () => {
    switch (walletType) {
      case 'base_account':
        return {
          title: 'BASE ACCOUNT TRANSACTION',
          description: 'Confirm with your passkey authentication',
          icon: '🔐'
        };
      case 'embedded':
        return {
          title: 'EMBEDDED WALLET TRANSACTION',
          description: 'Transaction signed automatically',
          icon: '⚡'
        };
      default:
        return { title: 'SEND TRANSACTION', description: '', icon: '💸' };
    }
  };

  const guidance = getTransactionGuidance();

  if (!address) return null;

  return (
    <div className="cyber-card p-8 rounded-lg max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold cyber-text-primary cyber-text-glow mb-4">
          SIMPLE SEND
        </h3>
        <p className="cyber-text-dim">Send ETH or USDC on Base Sepolia</p>
      </div>

      {/* Transaction Form */}
      <div className="space-y-6">
        {/* Token Selection */}
        <div>
          <label className="block text-sm font-bold cyber-text-primary mb-3 uppercase tracking-wide">
            Select Token
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setToken('ETH')}
              className={`p-4 rounded border-2 transition-all duration-300 ${
                token === 'ETH' 
                  ? 'border-cyber-blue bg-cyber-blue bg-opacity-10 cyber-glow-blue' 
                  : 'border-cyber-gray hover:border-cyber-blue'
              }`}
            >
              <div className="font-bold cyber-text-primary text-lg">ETH</div>
            </button>
            <button
              onClick={() => setToken('USDC')}
              className={`p-4 rounded border-2 transition-all duration-300 ${
                token === 'USDC' 
                  ? 'border-cyber-green bg-cyber-green bg-opacity-10 cyber-glow-green' 
                  : 'border-cyber-gray hover:border-cyber-green'
              }`}
            >
              <div className="font-bold cyber-text-green text-lg">USDC</div>
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-bold cyber-text-primary mb-3 uppercase tracking-wide">
            Amount ({token})
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.001"
              step="0.001"
              className="cyber-input w-full text-lg pr-16"
            />
            <div className="absolute right-4 top-1/2 transform -y-1/2 cyber-text-primary font-bold">
              {token}
            </div>
          </div>
          <div className="mt-2 text-xs cyber-text-dim">
            Minimum: 0.001 {token} • Network: Base Sepolia
          </div>
        </div>

        {/* Recipient Input */}
        <div>
          <label className="block text-sm font-bold cyber-text-primary mb-3 uppercase tracking-wide">
            Send To
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x... or ENS name or .base name"
            className="cyber-input w-full font-mono text-sm"
          />
          
          {/* Address Resolution Display */}
          {isResolving && (
            <div className="mt-2 text-xs cyber-text-blue">
              🔍 Resolving {recipient}...
            </div>
          )}
          
          {resolvedAddress && resolvedAddress !== recipient && (
            <div className={`mt-2 p-2 cyber-card rounded border ${
              resolvedAddress === 'NOT_FOUND' 
                ? 'border-cyber-pink' 
                : 'border-cyber-green'
            }`}>
              {resolvedAddress === 'NOT_FOUND' ? (
                <>
                  <div className="text-xs cyber-text-pink">❌ Name not found</div>
                  <div className="text-xs cyber-text-dim">Check spelling or try a different name</div>
                </>
              ) : (
                <>
                  <div className="text-xs cyber-text-green">✅ Resolved to:</div>
                  <div className="text-xs font-mono cyber-text-primary">{resolvedAddress}</div>
                </>
              )}
            </div>
          )}
          
        </div>

        {/* Error Display */}
        {error && (
          <div className="cyber-card border-cyber-pink p-4 rounded">
            <p className="text-sm cyber-text-pink">
              ⚠ Transaction Error: {error.message}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleTransaction}
          disabled={!amount || !recipient || isPending || isConfirming}
          className="cyber-button w-full py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending || isConfirming ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="cyber-pulse">⟳</div>
              <span>PROCESSING TRANSACTION...</span>
            </div>
          ) : (
            `SEND ${amount || '0'} ${token}`
          )}
        </button>

        {/* Success State */}
        {isSuccess && hash && (
          <div className="cyber-card border-cyber-green rounded text-center" style={{ padding: '32px' }}>
            <div className="cyber-text-green" style={{ fontSize: '3rem', marginBottom: '24px' }}>✅</div>
            <p className="cyber-text-green font-bold text-xl" style={{ marginBottom: '32px' }}>TRANSACTION CONFIRMED!</p>
            <a
              href={`https://sepolia.basescan.org/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="cyber-button border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-cyber-black"
              style={{ padding: '12px 24px', display: 'inline-block' }}
            >
              VIEW ON BASESCAN →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}