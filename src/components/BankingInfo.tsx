import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BankingDetails {
  id: number;
  account_number: string;
  account_title: string;
  bank_name: string;
  instructions: string | null;
  is_active: boolean;
}

interface BankingInfoProps {
  className?: string;
}

export default function BankingInfo({ className = "" }: BankingInfoProps) {
  const [bankingDetails, setBankingDetails] = useState<BankingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBankingDetails();
  }, []);

  const fetchBankingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_account_details')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching banking details:', error);
        // Fall back to hardcoded values if database access fails
        setBankingDetails({
          id: 1,
          account_number: '03492169543',
          account_title: 'Sultan',
          bank_name: 'EASY PAISA',
          instructions: null,
          is_active: true
        });
      } else {
        setBankingDetails(data);
      }
    } catch (error) {
      console.error('Error fetching banking details:', error);
      // Fall back to hardcoded values
      setBankingDetails({
        id: 1,
        account_number: '03492169543',
        account_title: 'Sultan',
        bank_name: 'EASY PAISA',
        instructions: null,
        is_active: true
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={className}>Loading banking information...</div>;
  }

  if (!bankingDetails) {
    return <div className={className}>Banking information unavailable</div>;
  }

  return (
    <div className={className}>
      <strong>{bankingDetails.account_number}</strong><br />
      {bankingDetails.account_title}<br />
      {bankingDetails.bank_name}
      {bankingDetails.instructions && (
        <>
          <br /><br />
          <em>{bankingDetails.instructions}</em>
        </>
      )}
    </div>
  );
}