import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        { count: totalClients },
        { count: totalFreelancers },
        { count: totalTasks },
        { count: openTasks },
        { count: pendingWithdrawals },
      ] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "client"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "freelancer"),
        supabase.from("tasks").select("*", { count: "exact", head: true }),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "requested"),
      ]);
      return {
        totalClients: totalClients || 0,
        totalFreelancers: totalFreelancers || 0,
        totalTasks: totalTasks || 0,
        openTasks: openTasks || 0,
        pendingWithdrawals: pendingWithdrawals || 0,
      };
    },
  });
};

export interface AdminUser {
  user_id: string;
  role: "admin" | "client" | "freelancer";
  created_at: string;
  email?: string | null;
  profile?: {
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
}

export const useAdminUsers = (roleFilter?: string) => {
  return useQuery({
    queryKey: ["admin-users", roleFilter],
    queryFn: async () => {
      let query = supabase.from("user_roles").select("*").limit(10000);
      if (roleFilter && roleFilter !== "all") {
        query = query.eq("role", roleFilter as "admin" | "client" | "freelancer");
      }
      const { data: roles, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = roles.map((r: any) => r.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, avatar_url, bio")
        .in("user_id", userIds)
        .limit(10000);

      const { data: emails } = await supabase.rpc("get_user_emails", {
        user_ids: userIds,
      });

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const emailMap = new Map((emails || []).map((e: any) => [e.user_id, e.email]));

      return roles.map((r: any) => ({
        ...r,
        email: emailMap.get(r.user_id) || null,
        profile: profileMap.get(r.user_id) || null,
      })) as AdminUser[];
    },
  });
};

export const useAdminTasks = () => {
  return useQuery({
    queryKey: ["admin-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          category:categories(name),
          bids(id, freelancer_id, amount, status, proposal, created_at)
        `)
        .order("created_at", { ascending: false })
        .limit(10000);
      if (error) throw error;

      // Collect all freelancer IDs from bids and client IDs
      const freelancerIds = [
        ...new Set(
          data.flatMap((t: any) => (t.bids || []).map((b: any) => b.freelancer_id))
        ),
      ];
      const clientIds = [...new Set(data.map((t: any) => t.client_id))];
      const allUserIds = [...new Set([...freelancerIds, ...clientIds])];

      if (allUserIds.length === 0) return data;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, phone")
        .in("user_id", allUserIds);

      const { data: emails } = await supabase.rpc("get_user_emails", {
        user_ids: allUserIds,
      });

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, p])
      );
      const emailMap = new Map((emails || []).map((e: any) => [e.user_id, e.email]));

      return data.map((task: any) => ({
        ...task,
        client_profile: profileMap.get(task.client_id) || null,
        client_email: emailMap.get(task.client_id) || null,
        bids: (task.bids || []).map((bid: any) => ({
          ...bid,
          freelancer_profile: profileMap.get(bid.freelancer_id) || null,
          freelancer_email: emailMap.get(bid.freelancer_id) || null,
        })),
      }));
    },
  });
};

export const useAdminWithdrawals = () => {
  return useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set(data.map((w: any) => w.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      return data.map((w: any) => ({
        ...w,
        profile: profileMap.get(w.user_id) || null,
      }));
    },
  });
};

export const useUpdateWithdrawalStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "requested" | "processing" | "completed" | "failed" }) => {
      const { error } = await supabase
        .from("withdrawals")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "open" | "in_progress" | "completed" | "cancelled" }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

export const useUpdateTaskDetails = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { description?: string; budget?: number; deadline?: string | null } }) => {
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

export const useAdminFreelancers = () => {
  return useQuery({
    queryKey: ["admin-freelancers-list"],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "freelancer");
      if (error) throw error;

      const userIds = roles.map((r) => r.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      return (profiles || []).map((p) => ({
        user_id: p.user_id,
        full_name: p.full_name || "Unnamed Freelancer",
      }));
    },
  });
};

export const useAssignTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, freelancerId, amount }: { taskId: string; freelancerId: string; amount: number }) => {
      // Create a bid on behalf of the freelancer
      const { data: bid, error: bidError } = await supabase
        .from("bids")
        .insert({
          task_id: taskId,
          freelancer_id: freelancerId,
          amount,
          proposal: "Assigned by admin",
          status: "accepted",
        })
        .select()
        .single();
      if (bidError) throw bidError;

      // Reject all other pending bids
      await supabase
        .from("bids")
        .update({ status: "rejected" })
        .eq("task_id", taskId)
        .eq("status", "pending")
        .neq("id", bid.id);

      // Update task
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ status: "in_progress", accepted_bid_id: bid.id })
        .eq("id", taskId);
      if (taskError) throw taskError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-bids"] });
    },
  });
};

export const useAdminBids = () => {
  return useQuery({
    queryKey: ["admin-bids"],
    queryFn: async () => {
      const { data: bids, error } = await supabase
        .from("bids")
        .select("*, task:tasks(id, title, budget, status, client_id)")
        .order("created_at", { ascending: false })
        .limit(10000);
      if (error) throw error;

      const freelancerIds = [...new Set((bids || []).map((b: any) => b.freelancer_id))];
      const clientIds = [...new Set((bids || []).map((b: any) => b.task?.client_id).filter(Boolean))];
      const allIds = [...new Set([...freelancerIds, ...clientIds])];

      if (allIds.length === 0) return bids;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", allIds)
        .limit(10000);

      const { data: emails } = await supabase.rpc("get_user_emails", { user_ids: allIds });

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const emailMap = new Map((emails || []).map((e: any) => [e.user_id, e.email]));

      return (bids || []).map((b: any) => ({
        ...b,
        freelancer_profile: profileMap.get(b.freelancer_id) || null,
        freelancer_email: emailMap.get(b.freelancer_id) || null,
        client_profile: b.task?.client_id ? profileMap.get(b.task.client_id) || null : null,
      }));
    },
  });
};
