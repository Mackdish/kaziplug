import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type BidStatus = Database["public"]["Enums"]["bid_status"];

export interface BidWithFreelancer {
  id: string;
  amount: number;
  proposal: string;
  status: BidStatus;
  created_at: string;
  updated_at: string;
  task_id: string;
  freelancer_id: string;
  freelancer_profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useBidsForTask = (taskId: string) => {
  return useQuery({
    queryKey: ["bids", taskId],
    queryFn: async () => {
      const { data: bids, error } = await supabase
        .from("bids")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      // Fetch freelancer profiles
      const freelancerIds = [...new Set(bids?.map(b => b.freelancer_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", freelancerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (bids || []).map(bid => ({
        ...bid,
        freelancer_profile: profileMap.get(bid.freelancer_id) || null
      })) as BidWithFreelancer[];
    },
    enabled: !!taskId,
  });
};

export const useMyBidForTask = (taskId: string, userId: string | undefined) => {
  return useQuery({
    queryKey: ["my-bid", taskId, userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("bids")
        .select("*")
        .eq("task_id", taskId)
        .eq("freelancer_id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!taskId && !!userId,
  });
};

export const useSubmitBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      freelancerId,
      amount,
      proposal,
    }: {
      taskId: string;
      freelancerId: string;
      amount: number;
      proposal: string;
    }) => {
      const { data, error } = await supabase
        .from("bids")
        .insert({
          task_id: taskId,
          freelancer_id: freelancerId,
          amount,
          proposal,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bids", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["my-bid", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

export const useUpdateBidStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bidId,
      status,
    }: {
      bidId: string;
      status: BidStatus;
    }) => {
      const { data, error } = await supabase
        .from("bids")
        .update({ status })
        .eq("id", bidId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bids"] });
      queryClient.invalidateQueries({ queryKey: ["my-bid"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

export const useAcceptBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bidId,
      taskId,
    }: {
      bidId: string;
      taskId: string;
    }) => {
      // 1. Accept this bid
      const { error: bidError } = await supabase
        .from("bids")
        .update({ status: "accepted" as BidStatus })
        .eq("id", bidId);
      if (bidError) throw bidError;

      // 2. Reject all other pending bids for this task
      const { error: rejectError } = await supabase
        .from("bids")
        .update({ status: "rejected" as BidStatus })
        .eq("task_id", taskId)
        .neq("id", bidId)
        .eq("status", "pending");
      if (rejectError) throw rejectError;

      // 3. Update task status to in_progress and set accepted_bid_id
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ status: "in_progress" as any, accepted_bid_id: bidId })
        .eq("id", taskId);
      if (taskError) throw taskError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bids"] });
      queryClient.invalidateQueries({ queryKey: ["my-bid"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["freelancer-active-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["freelancer-bids"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
    },
  });
};
