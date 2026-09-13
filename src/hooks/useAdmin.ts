import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ---------------- helpers ---------------- */

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const uniq = (ids: (string | null | undefined)[]) =>
  [...new Set(ids.filter(Boolean) as string[])];

const PAGE = 1000;

/**
 * PostgREST caps a single response at 1000 rows regardless of .limit(),
 * so page through with .range() until we have everything.
 */
async function fetchAllPages<T = any>(
  build: (from: number, to: number) => any
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 0; page < 50; page++) {
    const from = page * PAGE;
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    const rows = (data || []) as T[];
    all.push(...rows);
    if (rows.length < PAGE) break;
  }
  return all;
}

/** `.in()` goes in the URL, so a big id list produces a 414. Fetch in chunks. */
async function fetchProfilesByIds(ids: string[], columns: string) {
  const unique = uniq(ids);
  const out: any[] = [];
  for (const part of chunk(unique, 100)) {
    const { data, error } = await supabase
      .from("profiles")
      .select(columns)
      .in("user_id", part);
    if (error) {
      console.error("Failed to load a batch of profiles", error);
      continue;
    }
    out.push(...(data || []));
  }
  return out;
}

async function fetchEmailsByIds(ids: string[]) {
  const unique = uniq(ids);
  const out: any[] = [];
  for (const part of chunk(unique, 300)) {
    const { data, error } = await supabase.rpc("get_user_emails", {
      user_ids: part,
    });
    if (error) {
      console.error("Failed to load a batch of emails", error);
      continue;
    }
    out.push(...(data || []));
  }
  return out;
}

/* ---------------- hooks ---------------- */

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
        { count: totalBids },
      ] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "client"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "freelancer"),
        supabase.from("tasks").select("*", { count: "exact", head: true }),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "requested"),
        supabase.from("bids").select("*", { count: "exact", head: true }),
      ]);
      return {
        totalClients: totalClients || 0,
        totalFreelancers: totalFreelancers || 0,
        totalTasks: totalTasks || 0,
        openTasks: openTasks || 0,
        pendingWithdrawals: pendingWithdrawals || 0,
        totalBids: totalBids || 0,
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
      const roles = await fetchAllPages((from, to) => {
        let q = supabase.from("user_roles").select("*");
        if (roleFilter && roleFilter !== "all") {
          q = q.eq("role", roleFilter as "admin" | "client" | "freelancer");
        }
        return q.order("created_at", { ascending: false }).range(from, to);
      });

      const userIds = roles.map((r: any) => r.user_id);
      if (userIds.length === 0) return [];

      const [profiles, emails] = await Promise.all([
        fetchProfilesByIds(userIds, "user_id, full_name, phone, avatar_url, bio"),
        fetchEmailsByIds(userIds),
      ]);

      const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));
      const emailMap = new Map(emails.map((e: any) => [e.user_id, e.email]));

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
      const data = await fetchAllPages((from, to) =>
        supabase
          .from("tasks")
          .select(`
            *,
            category:categories(name),
            bids(id, freelancer_id, amount, status, proposal, created_at)
          `)
          .order("created_at", { ascending: false })
          .range(from, to)
      );

      const freelancerIds = data.flatMap((t: any) =>
        (t.bids || []).map((b: any) => b.freelancer_id)
      );
      const clientIds = data.map((t: any) => t.client_id);
      const allUserIds = uniq([...freelancerIds, ...clientIds]);

      if (allUserIds.length === 0) return data;

      const [profiles, emails] = await Promise.all([
        fetchProfilesByIds(allUserIds, "user_id, full_name, avatar_url, phone"),
        fetchEmailsByIds(allUserIds),
      ]);

      const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));
      const emailMap = new Map(emails.map((e: any) => [e.user_id, e.email]));

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
      const data = await fetchAllPages((from, to) =>
        supabase
          .from("withdrawals")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, to)
      );

      const userIds = uniq(data.map((w: any) => w.user_id));
      if (userIds.length === 0) return data;

      const profiles = await fetchProfilesByIds(userIds, "user_id, full_name, phone");
      const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));

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
      const roles = await fetchAllPages((from, to) =>
        supabase.from("user_roles").select("user_id").eq("role", "freelancer").range(from, to)
      );

      const userIds = roles.map((r: any) => r.user_id);
      if (userIds.length === 0) return [];

      const profiles = await fetchProfilesByIds(userIds, "user_id, full_name");
      const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));

      return userIds.map((id) => ({
        user_id: id,
        full_name: profileMap.get(id)?.full_name || "Unnamed Freelancer",
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
      const bids = await fetchAllPages((from, to) =>
        supabase
          .from("bids")
          .select("*, task:tasks(id, title, budget, status, client_id)")
          .order("created_at", { ascending: false })
          .range(from, to)
      );

      const allIds = uniq([
        ...bids.map((b: any) => b.freelancer_id),
        ...bids.map((b: any) => b.task?.client_id),
      ]);

      if (allIds.length === 0) return bids;

      const [profiles, emails] = await Promise.all([
        fetchProfilesByIds(allIds, "user_id, full_name, avatar_url, phone"),
        fetchEmailsByIds(allIds),
      ]);

      const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));
      const emailMap = new Map(emails.map((e: any) => [e.user_id, e.email]));

      return bids.map((b: any) => ({
        ...b,
        freelancer_profile: profileMap.get(b.freelancer_id) || null,
        freelancer_email: emailMap.get(b.freelancer_id) || null,
        client_profile: b.task?.client_id ? profileMap.get(b.task.client_id) || null : null,
      }));
    },
  });
};
