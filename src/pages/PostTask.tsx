import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, DollarSign, Calendar, Info, Loader2, Phone, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const USD_TO_KES_RATE = 130;

const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(10, "Title must be at least 10 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .trim()
    .min(50, "Description must be at least 50 characters")
    .max(2000, "Description must be less than 2000 characters"),
  category_id: z.string().uuid("Please select a category"),
  budget: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Budget must be a positive number")
    .refine((val) => Number(val) >= 5, "Minimum budget is $5")
    .refine((val) => Number(val) <= 100000, "Maximum budget is $100,000"),
  deadline: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, "Deadline must be today or in the future"),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface Category {
  id: string;
  name: string;
  icon: string;
}

const PostTask = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pendingTaskData, setPendingTaskData] = useState<TaskFormValues | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "stk_sent" | "polling" | "success" | "failed">("idle");
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      category_id: "",
      budget: "",
      deadline: "",
    },
  });

  const budgetValue = form.watch("budget");
  const kesAmount = budgetValue && !isNaN(Number(budgetValue)) ? Math.ceil(Number(budgetValue) * USD_TO_KES_RATE) : 0;

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, icon")
        .order("name");

      if (error) {
        toast.error("Failed to load categories");
        console.error("Error fetching categories:", error);
      } else {
        setCategories(data || []);
      }
      setIsLoadingCategories(false);
    };

    fetchCategories();
  }, []);

  // Poll for payment completion
  useEffect(() => {
    if (!transactionId || paymentStatus !== "polling") return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("transactions")
        .select("escrow_status")
        .eq("id", transactionId)
        .single();

      if (data?.escrow_status === "held") {
        setPaymentStatus("success");
        clearInterval(interval);
        toast.success("Payment received! Task posted successfully.");
        setTimeout(() => navigate("/dashboard/client"), 2000);
      } else if (data?.escrow_status === "refunded") {
        setPaymentStatus("failed");
        clearInterval(interval);
        toast.error("Payment failed. Please try again.");
      }
    }, 3000);

    // Stop polling after 2 minutes
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (paymentStatus === "polling") {
        setPaymentStatus("failed");
        toast.error("Payment timed out. Check your M-Pesa and try again.");
      }
    }, 120000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [transactionId, paymentStatus, navigate]);

  const onSubmit = async (values: TaskFormValues) => {
    if (!user) {
      toast.error("You must be logged in to post a task");
      return;
    }

    // Admins can post tasks without payment
    if (isAdmin) {
      const { error } = await supabase.from("tasks").insert({
        client_id: user.id,
        title: values.title.trim(),
        description: values.description.trim(),
        category_id: values.category_id,
        budget: Number(values.budget),
        deadline: new Date(values.deadline).toISOString(),
        status: "open",
      });

      if (error) {
        console.error("Error creating task:", error);
        toast.error(error.message || "Failed to create task");
        return;
      }

      toast.success("Task posted successfully!");
      navigate("/dashboard/admin");
      return;
    }

    setPendingTaskData(values);
    setShowPaymentDialog(true);
    setPaymentStatus("idle");
  };

  const handlePayment = async () => {
    if (!user || !pendingTaskData || !phoneNumber.trim()) {
      toast.error("Please enter your M-Pesa phone number");
      return;
    }

    setIsProcessingPayment(true);
    try {
      // 1. Create the task
      const { data: task, error: taskError } = await supabase.from("tasks").insert({
        client_id: user.id,
        title: pendingTaskData.title.trim(),
        description: pendingTaskData.description.trim(),
        category_id: pendingTaskData.category_id,
        budget: Number(pendingTaskData.budget),
        deadline: new Date(pendingTaskData.deadline).toISOString(),
        status: "open",
      }).select().single();

      if (taskError) {
        throw new Error(taskError.message);
      }

      // 2. Create transaction record
      const { data: transaction, error: txError } = await supabase.from("transactions").insert({
        task_id: task.id,
        payer_id: user.id,
        amount: Number(pendingTaskData.budget),
        payment_method: "mpesa" as const,
        escrow_status: "pending" as const,
      }).select().single();

      if (txError) {
        throw new Error(txError.message);
      }

      setTransactionId(transaction.id);

      // 3. Trigger STK push
      const { data: stkResult, error: stkError } = await supabase.functions.invoke(
        "mpesa-stk-push",
        {
          body: {
            phone_number: phoneNumber,
            task_id: task.id,
            user_id: user.id,
            payment_id: transaction.id,
            amount: kesAmount,
            payment_type: "task_payment",
          },
        }
      );

      if (stkError) throw stkError;
      if (stkResult?.error) throw new Error(stkResult.error);

      setPaymentStatus("polling");
      toast.info("STK push sent! Check your phone to complete payment.");
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed. Please try again.");
      setPaymentStatus("failed");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="container py-8 flex-1">
        <Link
          to="/dashboard/client"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Post a New Task</h1>
          <p className="text-muted-foreground mb-8">
            Describe your project and pay via M-Pesa to start receiving bids
          </p>

          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Build a modern e-commerce website"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Be specific and descriptive (10-100 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your project in detail. Include requirements, deliverables, and any specific skills needed..."
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include all requirements and deliverables (50-2000 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingCategories ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : (
                              categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget (USD)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                placeholder="500"
                                className="pl-10"
                                min="5"
                                max="100000"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          {kesAmount > 0 && (
                            <FormDescription>
                              ≈ KES {kesAmount.toLocaleString()} (rate: 1 USD = {USD_TO_KES_RATE} KES)
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deadline</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="date"
                                className="pl-10"
                                min={new Date().toISOString().split("T")[0]}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-muted rounded-lg p-4 flex gap-3">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Payment Required</p>
                      <p className="text-muted-foreground">
                        You'll pay the full task budget via M-Pesa when posting. The funds
                        will be held in escrow and released to the freelancer only after
                        you approve the completed work.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(-1)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 gradient-hero border-0"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>Post Task & Pay via M-Pesa</>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* M-Pesa Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={(open) => {
        if (!isProcessingPayment && paymentStatus !== "polling") {
          setShowPaymentDialog(open);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay via M-Pesa</DialogTitle>
            <DialogDescription>
              Enter your M-Pesa phone number to pay for this task
            </DialogDescription>
          </DialogHeader>

          {paymentStatus === "success" ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <div className="text-center">
                <p className="text-lg font-semibold">Payment Successful!</p>
                <p className="text-muted-foreground">Your task has been posted. Redirecting...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Task Budget (USD)</span>
                  <span className="font-medium">${Number(pendingTaskData?.budget || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Exchange Rate</span>
                  <span>1 USD = {USD_TO_KES_RATE} KES</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span>Amount to Pay (KES)</span>
                  <span className="text-primary">KES {kesAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">M-Pesa Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g., 0712345678"
                    className="pl-10"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isProcessingPayment || paymentStatus === "polling"}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  You'll receive an STK push on this number
                </p>
              </div>

              {paymentStatus === "polling" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Waiting for M-Pesa confirmation... Check your phone.
                </div>
              )}

              {paymentStatus === "failed" && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                  Payment failed or timed out. You can try again.
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowPaymentDialog(false);
                    setPaymentStatus("idle");
                  }}
                  disabled={isProcessingPayment || paymentStatus === "polling"}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handlePayment}
                  disabled={isProcessingPayment || paymentStatus === "polling" || !phoneNumber.trim()}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : paymentStatus === "polling" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Waiting...
                    </>
                  ) : (
                    `Pay KES ${kesAmount.toLocaleString()}`
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default PostTask;
