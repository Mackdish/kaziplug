import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, CreditCard, Building, Pencil, Save } from "lucide-react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, TaskStatus } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  useAdminStats,
  useAdminUsers,
  useAdminTasks,
  useAdminWithdrawals,
  useUpdateWithdrawalStatus,
  useUpdateTaskStatus,
  useUpdateTaskDetails,
  useAdminFreelancers,
  useAssignTask,
} from "@/hooks/useAdmin";
import { format } from "date-fns";
import { useAdminPaymentMethods, PaymentMethod } from "@/hooks/usePaymentMethods";
import {
  Users,
  Briefcase,
  DollarSign,
  Search,
  CheckCircle2,
  XCircle,
  UserCheck,
  Loader2,
  UserPlus,
  Clock,
} from "lucide-react";

const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [assignDialog, setAssignDialog] = useState<{ taskId: string; budget: number } | null>(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState("");
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: users = [], isLoading: usersLoading } = useAdminUsers(userRoleFilter);
  const { data: tasks = [], isLoading: tasksLoading } = useAdminTasks();
  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useAdminWithdrawals();
  const { data: freelancers = [] } = useAdminFreelancers();
  const freelancerUserIds = users.filter(u => u.role === "freelancer").map(u => u.user_id);
  const { data: paymentMethods = [] } = useAdminPaymentMethods(freelancerUserIds);
  const updateWithdrawal = useUpdateWithdrawalStatus();
  const updateTask = useUpdateTaskStatus();
  const assignTask = useAssignTask();

  const filteredUsers = users.filter(
    (u) =>
      !searchQuery ||
      u.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.user_id.includes(searchQuery)
  );

  const filteredTasks = tasks.filter(
    (t: any) =>
      !searchQuery ||
      t.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleWithdrawalAction = async (id: string, status: "completed" | "failed") => {
    try {
      await updateWithdrawal.mutateAsync({ id, status });
      toast.success(`Withdrawal ${status === "completed" ? "approved" : "rejected"}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleTaskAction = async (id: string, status: "cancelled") => {
    try {
      await updateTask.mutateAsync({ id, status });
      toast.success("Task cancelled");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAssign = async () => {
    if (!assignDialog || !selectedFreelancer) return;
    try {
      await assignTask.mutateAsync({
        taskId: assignDialog.taskId,
        freelancerId: selectedFreelancer,
        amount: assignDialog.budget,
      });
      toast.success("Task assigned to freelancer successfully");
      setAssignDialog(null);
      setSelectedFreelancer("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const statCards = [
    { title: "Clients", value: stats?.totalClients ?? "—", icon: UserCheck, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Freelancers", value: stats?.totalFreelancers ?? "—", icon: Users, color: "text-accent", bgColor: "bg-accent/10" },
    { title: "Total Tasks", value: stats?.totalTasks ?? "—", icon: Briefcase, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Pending Withdrawals", value: stats?.pendingWithdrawals ?? "—", icon: DollarSign, color: "text-destructive", bgColor: "bg-destructive/10" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container py-8 flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, tasks, and platform operations</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users, tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-4">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{stat.value}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList>
            <TabsTrigger value="clients" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="freelancers" className="gap-2">
              <Users className="h-4 w-4" />
              Freelancers
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Withdrawals
            </TabsTrigger>
          </TabsList>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <UserList users={filteredUsers.filter(u => u.role === "client")} loading={usersLoading} roleLabel="Client" />
          </TabsContent>

          {/* Freelancers Tab */}
          <TabsContent value="freelancers">
            <UserList users={filteredUsers.filter(u => u.role === "freelancer")} loading={usersLoading} roleLabel="Freelancer" paymentMethods={paymentMethods} />
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  All Tasks ({filteredTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                  </div>
                ) : filteredTasks.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTasks.map((task: any) => (
                      <div
                        key={task.id}
                        className="p-4 rounded-lg border hover:border-primary/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-medium truncate">{task.title}</h4>
                              <StatusBadge status={task.status as TaskStatus} />
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Budget: ${task.budget}</span>
                              <span>{task.category?.name || "Uncategorized"}</span>
                              <span>{task.bids?.length || 0} bids</span>
                              <span>{format(new Date(task.created_at), "MMM d, yyyy")}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {task.status === "open" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAssignDialog({ taskId: task.id, budget: task.budget })}
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Assign
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                  onClick={() => handleTaskAction(task.id, "cancelled")}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No tasks found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Withdrawals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {withdrawalsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                  </div>
                ) : withdrawals.length > 0 ? (
                  <div className="space-y-3">
                    {withdrawals.map((w: any) => (
                      <div key={w.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <p className="font-medium">{w.profile?.full_name || "Unknown User"}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{w.method}</span>
                            {w.phone_number && <span>• {w.phone_number}</span>}
                            <span>• {format(new Date(w.created_at), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg">${w.amount}</span>
                          <Badge
                            variant={
                              w.status === "completed" ? "default" :
                              w.status === "failed" ? "destructive" :
                              "secondary"
                            }
                          >
                            {w.status}
                          </Badge>
                          {w.status === "requested" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleWithdrawalAction(w.id, "completed")}
                                disabled={updateWithdrawal.isPending}
                              >
                                {updateWithdrawal.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleWithdrawalAction(w.id, "failed")}
                                disabled={updateWithdrawal.isPending}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No withdrawals yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => { if (!open) setSelectedTask(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="truncate">{selectedTask?.title}</span>
              {selectedTask && <StatusBadge status={selectedTask.status as TaskStatus} />}
            </DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-6 py-2">
              {/* Task Description */}
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedTask.description}</p>
              </div>

              {/* Task Meta */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="font-semibold">${selectedTask.budget}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium">{selectedTask.category?.name || "Uncategorized"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Posted</p>
                  <p className="font-medium">{format(new Date(selectedTask.created_at), "MMM d, yyyy")}</p>
                </div>
                {selectedTask.deadline && (
                  <div>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="font-medium">{format(new Date(selectedTask.deadline), "MMM d, yyyy")}</p>
                  </div>
                )}
              </div>

              {/* Client Info */}
              <div>
                <p className="text-sm font-medium mb-2">Client</p>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedTask.client_profile?.full_name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedTask.client_profile?.full_name || "Unknown Client"}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {selectedTask.client_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {selectedTask.client_email}
                        </span>
                      )}
                      {selectedTask.client_profile?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedTask.client_profile.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bids */}
              <div>
                <p className="text-sm font-medium mb-2">Bids ({selectedTask.bids?.length || 0})</p>
                {selectedTask.bids && selectedTask.bids.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTask.bids.map((bid: any) => (
                      <div key={bid.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {bid.freelancer_profile?.full_name?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{bid.freelancer_profile?.full_name || "Unknown"}</p>
                            {bid.freelancer_email && (
                              <p className="text-xs text-muted-foreground">{bid.freelancer_email}</p>
                            )}
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{bid.proposal}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-semibold">${bid.amount}</span>
                          <Badge
                            variant={
                              bid.status === "accepted" ? "default" :
                              bid.status === "rejected" ? "destructive" :
                              "secondary"
                            }
                            className="text-xs"
                          >
                            {bid.status}
                          </Badge>
                          {selectedTask.status === "open" && bid.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                setSelectedFreelancer(bid.freelancer_id);
                                setAssignDialog({ taskId: selectedTask.id, budget: bid.amount });
                                setSelectedTask(null);
                              }}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Accept
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No bids yet.</p>
                )}
              </div>

              {/* Actions */}
              {selectedTask.status === "open" && (
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAssignDialog({ taskId: selectedTask.id, budget: selectedTask.budget });
                      setSelectedTask(null);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Assign Freelancer
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => {
                      handleTaskAction(selectedTask.id, "cancelled");
                      setSelectedTask(null);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancel Task
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Task Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={(open) => { if (!open) { setAssignDialog(null); setSelectedFreelancer(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task to Freelancer</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Freelancer</label>
              <Select value={selectedFreelancer} onValueChange={setSelectedFreelancer}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a freelancer..." />
                </SelectTrigger>
                <SelectContent>
                  {freelancers.map((f) => (
                    <SelectItem key={f.user_id} value={f.user_id}>
                      {f.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {assignDialog && (
              <p className="text-sm text-muted-foreground">
                The freelancer will be assigned at the task budget of <strong>${assignDialog.budget}</strong>.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignDialog(null); setSelectedFreelancer(""); }}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedFreelancer || assignTask.isPending}>
              {assignTask.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Reusable user list component
const UserList = ({
  users,
  loading,
  roleLabel,
  paymentMethods,
}: {
  users: any[];
  loading: boolean;
  roleLabel: string;
  paymentMethods?: PaymentMethod[];
}) => {
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const getMethodIcon = (type: string) => {
    if (type === "mpesa") return Phone;
    if (type === "paypal") return CreditCard;
    return Building;
  };
  const getMethodLabel = (type: string) => {
    if (type === "mpesa") return "M-Pesa";
    if (type === "paypal") return "PayPal";
    return "Bank";
  };

  const selectedMethods = paymentMethods?.filter((pm) => pm.user_id === selectedUser?.user_id) || [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {roleLabel}s ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-3">
              {users.map((user) => {
                const userMethods = paymentMethods?.filter((pm) => pm.user_id === user.user_id) || [];
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.profile?.full_name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.profile?.full_name || "Unnamed User"}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {user.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                          )}
                          {user.profile?.phone && <span>• {user.profile.phone}</span>}
                          <span>• Joined {format(new Date(user.created_at), "MMM d, yyyy")}</span>
                        </div>
                        {userMethods.length > 0 && (
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {userMethods.map((pm) => {
                              const Icon = getMethodIcon(pm.method_type);
                              const summary = Object.values(pm.details || {}).filter(Boolean).join(" • ");
                              return (
                                <Badge key={pm.id} variant="outline" className="text-xs gap-1">
                                  <Icon className="h-3 w-3" />
                                  {getMethodLabel(pm.method_type)}: {summary}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">{user.role}</Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No {roleLabel.toLowerCase()}s found.</p>
          )}
        </CardContent>
      </Card>

      {/* User Profile Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6 py-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedUser.profile?.full_name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.profile?.full_name || "Unnamed User"}</h3>
                  <Badge variant="secondary" className="capitalize">{selectedUser.role}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                {selectedUser.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedUser.email}</span>
                  </div>
                )}
                {selectedUser.profile?.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedUser.profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {format(new Date(selectedUser.created_at), "MMMM d, yyyy")}</span>
                </div>
              </div>

              {selectedUser.profile?.bio && (
                <div>
                  <p className="text-sm font-medium mb-1">Bio</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.profile.bio}</p>
                </div>
              )}

              {selectedMethods.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Payment Methods</p>
                  <div className="space-y-2">
                    {selectedMethods.map((pm) => {
                      const Icon = getMethodIcon(pm.method_type);
                      return (
                        <div key={pm.id} className="flex items-center gap-3 p-3 rounded-lg border">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{getMethodLabel(pm.method_type)}</p>
                            <p className="text-xs text-muted-foreground">
                              {Object.values(pm.details || {}).filter(Boolean).join(" • ")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDashboard;
