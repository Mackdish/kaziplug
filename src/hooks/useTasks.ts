import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];
const TASK_PAGE_SIZE = 40;

export interface TaskWithCategory {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string | null;
  status: TaskStatus;
  client_id: string;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  category: { id: string; name: string } | null;
  client_profile: { full_name: string | null; avatar_url: string | null } | null;
}

export const useTasks = (status?: TaskStatus) => {
  return useQuery({
    queryKey: ["tasks", status],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("id, title, description, budget, deadline, status, client_id, category_id, created_at, updated_at, category:categories(id, name)")
        .order("created_at", { ascending: false })
        .limit(TASK_PAGE_SIZE);

      if (status) query = query.eq("status", status);

      const { data: tasks, error } = await query;
      if (error) {
        console.error("Failed to load marketplace tasks:", error);
        throw error;
      }

      if (!tasks?.length) return [] as TaskWithCategory[];

      const clientIds = [...new Set(tasks.map(task => task.client_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", clientIds);

      if (profilesError) console.warn("Failed to load task profiles:", profilesError);
      const profileMap = new Map(profiles?.map(profile => [profile.user_id, profile]) || []);

      return tasks.map(task => ({
        ...task,
        client_profile: profileMap.get(task.client_id) || null,
      })) as TaskWithCategory[];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    retry: 2,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 5000),
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, icon")
        .order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    retry: 2,
  });
};
