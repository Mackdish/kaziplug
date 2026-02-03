import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { mockTasks, mockBids } from "@/lib/mockData";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  DollarSign,
  User,
  Star,
  Briefcase,
  ArrowLeft,
  Shield,
  CheckCircle,
} from "lucide-react";

const TaskDetails = () => {
  const { id } = useParams<{ id: string }>();
  const task = mockTasks.find((t) => t.id === id);
  const bids = mockBids.filter((b) => b.taskId === id);

  const [bidAmount, setBidAmount] = useState("");
  const [proposal, setProposal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!task) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Task Not Found</h1>
            <Link to="/marketplace">
              <Button>Back to Marketplace</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const daysUntilDeadline = () => {
    const deadline = new Date(task.deadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidAmount || !proposal) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    toast.success("Your bid has been submitted!");
    setBidAmount("");
    setProposal("");
  };

  const days = daysUntilDeadline();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="container py-8">
        {/* Back Button */}
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-2">
                    <StatusBadge status={task.status} />
                    <h1 className="text-2xl md:text-3xl font-bold">{task.title}</h1>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {task.clientName}
                      </div>
                      <Badge variant="secondary">{task.category}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-accent">{formatBudget(task.budget)}</div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Deadline: {formatDate(task.deadline)}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${days <= 3 ? "text-destructive" : ""}`}>
                    <Clock className="h-4 w-4" />
                    <span>{days > 0 ? `${days} days left` : "Overdue"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{task.bidsCount} bids</span>
                  </div>
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="font-semibold mb-3">Description</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {task.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Bids Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Bids ({bids.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bids.length > 0 ? (
                  bids.map((bid) => (
                    <div key={bid.id} className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={bid.freelancerAvatar} />
                          <AvatarFallback>{bid.freelancerName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-semibold">{bid.freelancerName}</h4>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                                  {bid.rating}
                                </div>
                                <span>{bid.completedJobs} jobs completed</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-accent">{formatBudget(bid.amount)}</div>
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-muted-foreground">{bid.proposal}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No bids yet. Be the first to bid!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Place Bid Card */}
            {task.status === "open" && (
              <Card>
                <CardHeader>
                  <CardTitle>Place Your Bid</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitBid} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Your Bid Amount</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Your Proposal</label>
                      <Textarea
                        placeholder="Explain why you're the best fit for this task..."
                        value={proposal}
                        onChange={(e) => setProposal(e.target.value)}
                        rows={5}
                      />
                    </div>
                    <Button type="submit" className="w-full gradient-hero border-0" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Bid"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Escrow Info */}
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Secure Escrow</h4>
                    <p className="text-sm text-muted-foreground">
                      Payment is held securely until you approve the completed work.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4">Payment Methods</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                    <div className="h-8 w-12 gradient-hero rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">VISA</span>
                    </div>
                    <span className="text-sm">Credit/Debit Card</span>
                    <CheckCircle className="h-4 w-4 text-accent ml-auto" />
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                    <div className="h-8 w-12 gradient-accent rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-accent-foreground">M-P</span>
                    </div>
                    <span className="text-sm">M-Pesa</span>
                    <CheckCircle className="h-4 w-4 text-accent ml-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TaskDetails;