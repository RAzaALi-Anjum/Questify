import React from 'react';
import { Session } from 'next-auth';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

interface RateLimitErrorProps {
    error: Error;
    session: Session | null;
    handlePurchaseCredits: () => void;
    isCheckoutLoading: boolean;
    priceString?: string | null;
    dictionary: any;
}

export function RateLimitError({ error }: { error: Error }) {
    return <>{error.message}</>;
}
