import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, ArrowLeft, CheckCircle2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let mounted = true;

    const prepareRecoverySession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      // Supabase normally establishes the recovery session from the email link
      // before the page loads. Also listen for PASSWORD_RECOVERY in case it
      // arrives asynchronously after navigation.
      setIsReady(!!session);
    };

    prepareRecoverySession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setIsReady(!!session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message || "Unable to update password");
        return;
      }

      setCompleted(true);
      toast.success("Password updated successfully");
      await supabase.auth.signOut();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl gradient-hero flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">Reset Your Password</CardTitle>
            <CardDescription>
              Choose a new password for your NextGig account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {completed ? (
              <div className="text-center space-y-5">
                <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Password changed</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your password has been updated. You can now sign in with your new password.
                  </p>
                </div>
                <Button className="w-full gradient-hero border-0" onClick={() => navigate("/login", { replace: true })}>
                  Sign In
                </Button>
              </div>
            ) : !isReady ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  This password reset link is invalid, expired, or has not been verified yet.
                </p>
                <Link to="/forgot-password" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  Request a New Reset Link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pl-10"
                      minLength={6}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Enter the password again"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="pl-10"
                      minLength={6}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-hero border-0" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
                <div className="text-center">
                  <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;
