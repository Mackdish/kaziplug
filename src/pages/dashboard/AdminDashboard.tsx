import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockTasks, mockUser } from "@/lib/mockData";
import {
  Users,
  Briefcase,
  DollarSign,
  AlertTriangle,
  Search,
  Settings,
  Shield,
  TrendingUp,
  BarChart3,
  Ban,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";

const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const stats = [
    {
      title: "Total Users",
      value: "12,458",
      change: "+12%",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Tasks",
      value: "3,842",
      change: "+8%",
      icon: Briefcase,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Total Revenue",
      value: "$124,500",
      change: "+23%",
      icon: DollarSign,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Pending Disputes",
      value: "24",
      change: "-5%",
      icon: AlertTriangle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  const recentUsers = [
    { id: "1", name: "Alex Johnson", email: "alex@email.com", role: "freelancer", status: "active" },
    { id: "2", name: "Sarah Chen", email: "sarah@email.com", role: "client", status: "active" },
    { id: "3", name: "Mike Williams", email: "mike@email.com", role: "freelancer", status: "pending" },
    { id: "4", name: "Emily Brown", email: "emily@email.com", role: "client", status: "suspended" },
  ];

  const pendingWithdrawals = [
    { id: "w1", user: "Alex Johnson", amount: 1250, method: "Stripe", date: "2024-01-25" },
    { id: "w2", user: "Sarah Chen", amount: 890, method: "M-Pesa", date: "2024-01-24" },
    { id: "w3", user: "James Wilson", amount: 2100, method: "Stripe", date: "2024-01-24" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="container py-8 flex-1">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, tasks, and platform settings</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users, tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <Badge variant={stat.change.startsWith("+") ? "default" : "secondary"} className="gap-1">
                    <ArrowUpRight className="h-3 w-3" />
                    {stat.change}
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="disputes" className="gap-2">
              <Shield className="h-4 w-4" />
              Disputes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            {user.name[0]}
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{user.role}</Badge>
                          <Badge 
                            variant={
                              user.status === "active" ? "default" : 
                              user.status === "pending" ? "secondary" : "destructive"
                            }
                          >
                            {user.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Freelancers</span>
                    <span className="font-semibold">8,234</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Clients</span>
                    <span className="font-semibold">4,224</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pending Verification</span>
                    <span className="font-semibold">156</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Suspended</span>
                    <span className="font-semibold text-destructive">23</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Pending Withdrawals</CardTitle>
                  <Badge variant="secondary">{pendingWithdrawals.length}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingWithdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                          <p className="font-medium">{withdrawal.user}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{withdrawal.method}</span>
                            <span>•</span>
                            <span>{withdrawal.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-accent">${withdrawal.amount}</span>
                          <Button size="sm" className="gradient-accent border-0">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline">
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Revenue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold text-accent">$24,580</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Month</p>
                    <p className="text-xl font-semibold">$21,340</p>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Platform Fee</span>
                      <span className="font-semibold">10%</span>
                    </div>
                    <Button variant="outline" className="w-full gap-2">
                      <Settings className="h-4 w-4" />
                      Adjust Fee
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Task Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Task management interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disputes">
            <Card>
              <CardHeader>
                <CardTitle>Dispute Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Dispute management interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;