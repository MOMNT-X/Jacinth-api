export interface InitializePaymentDto {
  amount: number;
  currency: string;
  email: string;
  reference?: string;
  metadata?: Record<string, any>;
  callbackUrl?: string;
}

export interface InitializePaymentResponse {
  authorizationUrl?: string;
  reference: string;
  accessCode?: string;
  provider: string;
  metadata?: any;
}

export interface VerifyPaymentResponse {
  status: 'success' | 'failed' | 'pending';
  reference: string;
  amount: number;
  currency: string;
  metadata?: any;
  providerResponse?: any;
}

export interface PaymentProvider {
  initializePayment(data: InitializePaymentDto): Promise<InitializePaymentResponse>;
  verifyPayment(reference: string): Promise<VerifyPaymentResponse>;
  verifyWebhook(body: any, signature: string): boolean;
  handleWebhook(body: any): Promise<VerifyPaymentResponse>;
}

