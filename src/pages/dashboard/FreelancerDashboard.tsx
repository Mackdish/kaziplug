import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge, TaskStatus } from "@/components/ui/status-badge";
import { mockTasks, mockUser } from "@/lib/mockData";
import {
  Briefcase,
  Wallet,
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  DollarSign,
  AlertCircle,
  Search,
} from "lucide-react";

const FreelancerDashboard = () => {
  const user = mockUser;
  const activeTasks = mockTasks.filter((t) => t.status === "in_progress" || t.status === "escrow");
  const completedTasks = mockTasks.filter((t) => t.status === "completed");

  const stats = [
    {
      title: "Available Balance",
      value: `$${user.walletBalance?.toLocaleString()}`,
      icon: Wallet,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Pending Balance",
      value: `$${user.pendingBalance?.toLocaleString()}`,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Completed Jobs",
      value: user.completedJobs,
      icon: CheckCircle2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Rating",
      value: user.rating,
      icon: Star,
      color: "text-warning",
      bgColor: "bg-warning/10",
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
              <p className="text-muted-foreground">Here's an overview of your freelance activity</p>
            </div>
          </div>
          <Link to="/marketplace">
            <Button className="gradient-hero border-0 gap-2">
              <Search className="h-4 w-4" />
              Find Tasks
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
          {/* Active Tasks */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Active Tasks
                </CardTitle>
                <Badge variant="secondary">{activeTasks.length}</Badge>
              </CardHeader>
              <CardContent>
                {activeTasks.length > 0 ? (
                  <div className="space-y-4">
                    {activeTasks.map((task) => (
                      <Link key={task.id} to={`/task/${task.id}`}>
                        <div className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{task.title}</h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span>{task.clientName}</span>
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
                    <p className="text-muted-foreground mb-4">No active tasks</p>
                    <Link to="/marketplace">
                      <Button>Browse Tasks</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Wallet Card */}
          <div className="space-y-6">
            <Card className="gradient-hero text-primary-foreground">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Your Wallet</h3>
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-primary-foreground/70 text-sm">Available</p>
                    <p className="text-3xl font-bold">${user.walletBalance?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-primary-foreground/70 text-sm">Pending</p>
                    <p className="text-xl font-semibold">${user.pendingBalance?.toLocaleString()}</p>
                  </div>
                </div>
                <Button className="w-full mt-6 bg-card text-foreground hover:bg-card/90">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Withdraw Funds
                </Button>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.skills?.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-semibold">98%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">On-Time Delivery</span>
                  <span className="font-semibold">95%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Response Time</span>
                  <span className="font-semibold">&lt; 2 hours</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerDashboard;