import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateZcredInput, parseZcreds } from "@/utils/formatZcreds";
import { getLatestConversionRate, convertPkrToZc, MIN_DEPOSIT_PKR } from "@/utils/conversionRate";
import { 
  validateFinancialAmount, 
  validateAndSanitizeText, 
  validateAccountNumber,
  checkRateLimit 
} from "@/utils/securityValidation";
import { StorageManager } from "@/utils/storageUtils";
import { SUPABASE_CONFIG } from "@/config/supabase";
import BankingInfo from "@/components/BankingInfo";
export default function WalletDeposit() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [conversionRate, setConversionRate] = useState<number>(1);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    amount_money: '',
    bank_sender_name: '',
    sender_bank: '',
    sender_account_no: '',
    transfer_timestamp: '',
    notes: '',
    screenshot_url: ''
  });
  useEffect(() => {
    checkAuth();
    loadConversionRate();
  }, []);

  const loadConversionRate = async () => {
    const rate = await getLatestConversionRate();
    setConversionRate(rate);
  };
  const checkAuth = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth');
      return;
    }
    setUser(session.user);
    setLoading(false);
  };
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploading(true);
    try {
      const requestId = `deposit-${Date.now()}`;
      const { url, error } = await StorageManager.uploadFile(file, user.id, requestId);
      
      if (error) {
        throw new Error(error);
      }
      
      setFormData(prev => ({
        ...prev,
        screenshot_url: url
      }));
      
      toast({
        title: "Upload successful",
        description: "Screenshot uploaded successfully"
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Upload failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Rate limiting check
    if (!checkRateLimit('deposit_submission', 3, 60000)) { // 3 attempts per minute
      toast({
        title: "Too Many Requests",
        description: "Please wait before submitting another deposit request",
        variant: "destructive"
      });
      return;
    }

    // Enhanced validation
    const amountValidation = validateFinancialAmount(formData.amount_money, 'pkr', MIN_DEPOSIT_PKR);
    if (!amountValidation.isValid) {
      toast({
        title: "Invalid Amount",
        description: amountValidation.error,
        variant: "destructive"
      });
      return;
    }

    const senderNameValidation = validateAndSanitizeText(formData.bank_sender_name, "Sender name", 2, 100);
    if (!senderNameValidation.isValid) {
      toast({
        title: "Invalid Sender Name",
        description: senderNameValidation.error,
        variant: "destructive"
      });
      return;
    }

    const bankValidation = validateAndSanitizeText(formData.sender_bank, "Bank name", 2, 50);
    if (!bankValidation.isValid) {
      toast({
        title: "Invalid Bank Name",
        description: bankValidation.error,
        variant: "destructive"
      });
      return;
    }

    const accountValidation = validateAccountNumber(formData.sender_account_no);
    if (!accountValidation.isValid) {
      toast({
        title: "Invalid Account Number",
        description: accountValidation.error,
        variant: "destructive"
      });
      return;
    }

    // Validate required fields
    if (!formData.amount_money || !formData.bank_sender_name || !formData.sender_bank || !formData.sender_account_no || !formData.transfer_timestamp) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setSubmitting(true);
    try {
      const pkrAmount = parseFloat(formData.amount_money);
      const zcAmount = convertPkrToZc(pkrAmount, conversionRate);
      
      const { error } = await supabase
        .from(SUPABASE_CONFIG.tables.ZCRED_DEPOSIT_FORMS)
        .insert({
          [SUPABASE_CONFIG.columns.zcred_deposit_forms.USER_ID]: user.id,
          [SUPABASE_CONFIG.columns.zcred_deposit_forms.AMOUNT_MONEY]: pkrAmount,
          [SUPABASE_CONFIG.columns.zcred_deposit_forms.AMOUNT_PKR]: pkrAmount,
          [SUPABASE_CONFIG.columns.zcred_deposit_forms.AMOUNT_ZC]: zcAmount,
          [SUPABASE_CONFIG.columns.zcred_deposit_forms.BANK_SENDER_NAME]: formData.bank_sender_name,
          [SUPABASE_CONFIG.columns.zcred_deposit_forms.SENDER_BANK]: formData.sender_bank,
          [SUPABASE_CONFIG.columns.zcred_deposit_forms.SENDER_ACCOUNT_NO]: formData.sender_account_no,
          [SUPABASE_CONFIG.columns.zcred_deposit_forms.TRANSFER_TIMESTAMP]: formData.transfer_timestamp,
          [SUPABASE_CONFIG.columns.zcred_deposit_forms.SCREENSHOT_URL]: formData.screenshot_url,
          [SUPABASE_CONFIG.columns.zcred_deposit_forms.NOTES]: formData.notes
        });
      if (error) throw error;
      toast({
        title: "Deposit request submitted!",
        description: "Your deposit request has been submitted for review. You'll be notified once it's processed."
      });
      navigate('/wallet');
    } catch (error: any) {
      console.error('Error submitting deposit:', error);
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit deposit request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-card rounded w-1/3"></div>
          <div className="h-64 bg-card rounded"></div>
        </div>
      </div>;
  }
  return <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/wallet')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Wallet
        </Button>
        
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Deposit Z-Credits
        </h1>
        <p className="text-text-secondary">
          Submit your bank transfer details to add Z-Credits to your account
        </p>
      </div>

      <Card className="esports-card">
        <CardHeader>
          <CardTitle className="text-text-primary flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Deposit Request
          </CardTitle>
          <CardDescription className="text-text-secondary">
            SEND YOUR AMOUNT ON AC MENTION BELOW AND WATCH THE YOUTUBE VIDEO FIRST TO DO IT IN CORRECT WAY
            <br /><br />
            Send your amount to the number below. Minimum deposit: {MIN_DEPOSIT_PKR} PKR ({MIN_DEPOSIT_PKR / conversionRate} Z-Credits)
            <br />Current rate: 1 Z-Credit = {conversionRate} PKR
            <br /><br />
            <BankingInfo />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount_money" className="text-text-primary">
                Amount (PKR) <span className="text-danger">*</span>
              </Label>
              <Input 
                id="amount_money" 
                type="number" 
                step="0.01" 
                min={MIN_DEPOSIT_PKR} 
                value={formData.amount_money} 
                onChange={e => handleInputChange('amount_money', e.target.value)} 
                placeholder={`Minimum ${MIN_DEPOSIT_PKR} PKR`} 
                className="rounded-2xl" 
                required 
              />
              {formData.amount_money && (
                <p className="text-sm text-text-secondary">
                  ≈ {convertPkrToZc(parseFloat(formData.amount_money) || 0, conversionRate).toFixed(2)} Z-Credits
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_sender_name" className="text-text-primary">
                Sender Name <span className="text-danger">*</span>
              </Label>
              <Input id="bank_sender_name" value={formData.bank_sender_name} onChange={e => handleInputChange('bank_sender_name', e.target.value)} placeholder="Name on bank account" className="rounded-2xl" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender_bank" className="text-text-primary">
                Bank Name <span className="text-danger">*</span>
              </Label>
              <Input id="sender_bank" value={formData.sender_bank} onChange={e => handleInputChange('sender_bank', e.target.value)} placeholder="e.g., HBL, UBL, MCB" className="rounded-2xl" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender_account_no" className="text-text-primary">
                Account Number <span className="text-danger">*</span>
              </Label>
              <Input id="sender_account_no" value={formData.sender_account_no} onChange={e => handleInputChange('sender_account_no', e.target.value)} placeholder="Your account number" className="rounded-2xl" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer_timestamp" className="text-text-primary">
                Transfer Date & Time <span className="text-danger">*</span>
              </Label>
              <Input id="transfer_timestamp" type="datetime-local" value={formData.transfer_timestamp} onChange={e => handleInputChange('transfer_timestamp', e.target.value)} className="rounded-2xl" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="screenshot" className="text-text-primary">
                Transfer Receipt/Screenshot
              </Label>
              <div className="flex items-center gap-4">
                <Input id="screenshot" type="file" accept="image/*" onChange={handleFileUpload} className="rounded-2xl" disabled={uploading} />
                {uploading && <div className="flex items-center gap-2 text-primary">
                    <Upload className="w-4 h-4 animate-pulse" />
                    <span className="text-sm">Uploading...</span>
                  </div>}
              </div>
              {formData.screenshot_url && <p className="text-sm text-success">✓ Screenshot uploaded successfully</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-text-primary">
                Additional Notes
              </Label>
              <Textarea id="notes" value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)} placeholder="Any additional information about the transfer" className="rounded-2xl min-h-[100px]" />
            </div>

            <div className="bg-secondary/50 rounded-2xl p-4">
              <h3 className="font-semibold text-text-primary mb-2">Important Information</h3>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• Deposits are manually reviewed and processed within 24 hours</li>
                <li>• Exchange rate: {conversionRate} PKR = 1 Z-Credit</li>
                <li>• Minimum deposit: {MIN_DEPOSIT_PKR} PKR</li>
                <li>• Ensure all transfer details are accurate</li>
                <li>• Include a clear screenshot of your transfer receipt</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/wallet')} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="esports" disabled={submitting || uploading} className="flex-1">
                {submitting ? "Submitting..." : "Submit Deposit Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>;
}