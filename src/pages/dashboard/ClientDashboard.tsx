import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { mockTasks } from "@/lib/mockData";
import {
  Plus,
  Briefcase,
  Clock,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  AlertCircle,
  Users,
} from "lucide-react";

const ClientDashboard = () => {
  const user = {
    id: "c1",
    name: "Sarah Johnson",
    email: "sarah@company.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah2",
  };

  // Simulate client's tasks
  const myTasks = mockTasks.slice(0, 4);
  const openTasks = myTasks.filter((t) => t.status === "open");
  const activeTasks = myTasks.filter((t) => t.status === "in_progress" || t.status === "escrow");

  const stats = [
    {
      title: "Posted Tasks",
      value: myTasks.length,
      icon: Briefcase,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Open Tasks",
      value: openTasks.length,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "In Progress",
      value: activeTasks.length,
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Total Spent",
      value: "$8,500",
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="container py-8 flex-1">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {user.name.split(" ")[0]}!</h1>
              <p className="text-muted-foreground">Manage your tasks and find talent</p>
            </div>
          </div>
          <Link to="/post-task">
            <Button className="gradient-hero border-0 gap-2">
              <Plus className="h-4 w-4" />
              Post a Task
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* My Tasks */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  My Tasks
                </CardTitle>
                <Link to="/my-tasks">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {myTasks.length > 0 ? (
                  <div className="space-y-4">
                    {myTasks.map((task) => (
                      <Link key={task.id} to={`/task/${task.id}`}>
                        <div className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{task.title}</h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span>{task.bidsCount} bids</span>
                              <StatusBadge status={task.status} />
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-bold text-accent">${task.budget}</div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto mt-1" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No tasks yet</p>
                    <Link to="/post-task">
                      <Button>Post Your First Task</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/post-task" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Plus className="h-4 w-4" />
                    Post New Task
                  </Button>
                </Link>
                <Link to="/marketplace" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Users className="h-4 w-4" />
                    Browse Freelancers
                  </Button>
                </Link>
                <Link to="/payments" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <DollarSign className="h-4 w-4" />
                    Payment History
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pending Actions */}
            <Card className="border-warning/30 bg-warning/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  Pending Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Tasks awaiting payment</span>
                  <Badge variant="secondary">2</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Work to review</span>
                  <Badge variant="secondary">1</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Open bids to review</span>
                  <Badge variant="secondary">15</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="flex gap-3">
                    <div className="h-2 w-2 rounded-full bg-accent mt-2"></div>
                    <div>
                      <p>New bid received on "Build E-commerce Website"</p>
                      <p className="text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                    <div>
                      <p>Task "Design Mobile App UI" marked as complete</p>
                      <p className="text-muted-foreground">Yesterday</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-2 w-2 rounded-full bg-warning mt-2"></div>
                    <div>
                      <p>Payment released for "Content Writing"</p>
                      <p className="text-muted-foreground">3 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;