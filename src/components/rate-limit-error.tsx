import React from 'react';
import { Session } from 'next-auth';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

type Props = {
  error: Error;
  session?: any;
  handlePurchaseCredits?: () => void;
  isCheckoutLoading?: boolean;
  priceString?: string | null;
  dictionary?: any;
};

export default function RateLimitError({
  error,
  session,
  handlePurchaseCredits,
  isCheckoutLoading,
  priceString,
  dictionary
}: Props) {
  // use them if needed...
  return <>{error.message}</>;
}
