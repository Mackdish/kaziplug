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
      let query = supabase.from("user_roles").select("*");
      if (roleFilter && roleFilter !== "all") {
        query = query.eq("role", roleFilter as "admin" | "client" | "freelancer");
      }
      const { data: roles, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch profiles for these users
      const userIds = roles.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, avatar_url, bio")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      return roles.map((r: any) => ({
        ...r,
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
          bids(id)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
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
