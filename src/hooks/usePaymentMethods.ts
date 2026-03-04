import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PayoutMethodType = "mpesa" | "paypal" | "bank";

export interface PaymentMethod {
  id: string;
  user_id: string;
  method_type: PayoutMethodType;
  details: Record<string, string>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const usePaymentMethods = (userId?: string) => {
  return useQuery({
    queryKey: ["payment-methods", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods" as any)
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PaymentMethod[];
    },
  });
};

export const useUpsertPaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      methodType,
      details,
      isDefault,
    }: {
      userId: string;
      methodType: PayoutMethodType;
      details: Record<string, string>;
      isDefault?: boolean;
    }) => {
      // Check if exists
      const { data: existing } = await supabase
        .from("payment_methods" as any)
        .select("id")
        .eq("user_id", userId)
        .eq("method_type", methodType)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("payment_methods" as any)
          .update({ details, is_default: isDefault ?? false } as any)
          .eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("payment_methods" as any)
          .insert({
            user_id: userId,
            method_type: methodType,
            details,
            is_default: isDefault ?? false,
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods", variables.userId] });
    },
  });
};

export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from("payment_methods" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods", userId] });
    },
  });
};

// Admin: fetch payment methods for multiple users
export const useAdminPaymentMethods = (userIds: string[]) => {
  return useQuery({
    queryKey: ["admin-payment-methods", userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods" as any)
        .select("*")
        .in("user_id", userIds);
      if (error) throw error;
      return (data || []) as unknown as PaymentMethod[];
    },
  });
};
