import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useSignInWithEmail, useVerifyEmailOTP, useIsSignedIn, useEvmAddress, useSignOut } from '@coinbase/cdp-hooks';
import { useState, useEffect } from 'react';

export type WalletType = 'base_account' | 'embedded' | 'none';

export function useUnifiedAuth() {
  // Wagmi hooks for Base Account
  const { address: wagmiAddress, isConnected: wagmiConnected, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();

  // CDP hooks for embedded wallet - these work with CDPReactProvider
  const { signInWithEmail, isLoading: isSigningIn } = useSignInWithEmail();
  const { verifyEmailOTP, isLoading: isVerifying } = useVerifyEmailOTP();
  const { isSignedIn: cdpSignedIn } = useIsSignedIn();
  const { evmAddress: cdpAddress } = useEvmAddress();
  const { signOut } = useSignOut();

  const [walletType, setWalletType] = useState<WalletType>('none');
  const [flowId, setFlowId] = useState<string>('');

  // Determine which wallet is active and prioritize the active one
  const address = wagmiConnected ? wagmiAddress : (cdpAddress || (cdpSignedIn ? 'loading...' : undefined));
  const isConnected = !!(wagmiAddress || cdpAddress || cdpSignedIn); // Connected if we have ANY wallet state

  useEffect(() => {
    console.log('🔍 useUnifiedAuth Debug:', {
      wagmiConnected: !!wagmiConnected,
      wagmiAddress: wagmiAddress || 'undefined',
      cdpSignedIn: !!cdpSignedIn,
      cdpAddress: cdpAddress || 'undefined',
      connectorName: connector?.name || 'none',
      finalAddress: address || 'undefined',
      finalIsConnected: !!isConnected,
      finalWalletType: walletType
    });

    // Check if we have an address from either system
    if (wagmiConnected && wagmiAddress && connector?.name === 'Base Account') {
      setWalletType('base_account');
    } else if (cdpAddress || cdpSignedIn) {
      // If we have a CDP address OR CDP thinks we're signed in, consider it connected
      setWalletType('embedded');
    } else {
      setWalletType('none');
    }
  }, [wagmiConnected, wagmiAddress, cdpSignedIn, cdpAddress, connector]);

  const connectBaseAccount = () => {
    const baseConnector = connectors.find(c => c.name === 'Base Account');
    if (baseConnector) {
      connect({ connector: baseConnector });
    }
  };

  const signInWithEmbeddedWallet = async (email: string) => {
    try {
      console.log('📧 Starting email sign-in for:', email);
      console.log('📧 signInWithEmail function available:', !!signInWithEmail);
      
      if (!signInWithEmail) {
        console.error('❌ signInWithEmail function not available');
        return false;
      }
      
      // Always try to sign out first to clear any cached state
      console.log('🔄 Clearing any existing CDP authentication state...');
      try {
        await signOut();
        console.log('✅ Signed out successfully');
        // Wait a moment for state to clear
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (signOutError) {
        console.log('⚠️ Sign out failed (might not have been signed in):', signOutError);
      }
      
      const response = await signInWithEmail({ email });
      console.log('📧 Email sign-in response:', response);

      if (response && typeof response === 'object' && 'flowId' in response) {
        setFlowId(response.flowId as string);
        console.log('✅ Got flowId:', response.flowId);
      } else {
        console.log('⚠️ No flowId in response, but sign-in may have succeeded');
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to sign in with email:', error);
      
      // If already authenticated, that's actually success - user is already signed in!
      if (error instanceof Error && error.message.includes('already authenticated')) {
        console.log('🎉 User already authenticated - skipping email/OTP flow entirely!');
        // Set a special flag to indicate we should skip OTP
        setFlowId('ALREADY_AUTHENTICATED');
        return true;
      }
      
      return false;
    }
  };

  const verifyOtpAndConnect = async (otp: string) => {
    try {
      console.log('🔐 Verifying OTP with flowId:', flowId);
      
      // If flowId indicates already authenticated, skip verification
      if (flowId === 'ALREADY_AUTHENTICATED') {
        console.log('🎉 User already authenticated - skipping OTP verification!');
        return true;
      }
      
      // Check if already authenticated and sign out first if needed
      if (cdpSignedIn) {
        console.log('🔄 User already authenticated, signing out first...');
        // Note: CDP handles sign out automatically, just proceed with verification
      }
      
      // With CDPReactProvider, verifyEmailOTP automatically signs the user in
      await verifyEmailOTP({ flowId, otp });
      console.log('✅ OTP verified successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to verify OTP:', error);
      
      // If already authenticated error, try to handle gracefully
      if (error instanceof Error && error.message.includes('already authenticated')) {
        console.log('🔄 User already authenticated, considering this success');
        return true;
      }
      
      return false;
    }
  };

  const disconnect = async () => {
    console.log('🔌 Disconnect called - current state:', { wagmiConnected, cdpSignedIn, walletType });
    
    if (wagmiConnected) {
      console.log('🔌 Disconnecting Wagmi (Base Account)...');
      wagmiDisconnect();
    }
    
    if (cdpSignedIn || walletType === 'embedded') {
      console.log('🔌 Signing out of CDP (Embedded Wallet)...');
      try {
        await signOut();
        console.log('✅ CDP sign out successful');
      } catch (error) {
        console.error('❌ CDP sign out failed:', error);
      }
    }
  };

  return {
    address,
    isConnected,
    walletType,
    connectBaseAccount,
    signInWithEmbeddedWallet,
    verifyOtpAndConnect,
    disconnect,
    isSigningIn,
    isVerifying,
  };
}