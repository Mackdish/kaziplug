
CREATE TYPE public.payout_method_type AS ENUM ('mpesa', 'paypal', 'bank');

CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  method_type payout_method_type NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, method_type)
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods"
  ON public.payment_methods FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Freelancers can insert own payment methods"
  ON public.payment_methods FOR INSERT
  WITH CHECK (user_id = auth.uid() AND public.is_freelancer());

CREATE POLICY "Users can update own payment methods"
  ON public.payment_methods FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own payment methods"
  ON public.payment_methods FOR DELETE
  USING (user_id = auth.uid());

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
