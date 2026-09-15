import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Smartphone, Wallet } from "lucide-react";

const Payments = () => (
  <div className="min-h-screen flex flex-col"><Header /><main className="flex-1">
    <section className="gradient-hero py-16"><div className="container text-center text-primary-foreground"><Wallet className="h-12 w-12 mx-auto mb-4" /><h1 className="text-4xl font-bold mb-3">Payments & Escrow</h1><p className="text-primary-foreground/80 max-w-2xl mx-auto">Simple Kenyan Shilling payments with an escrow workflow that helps protect both sides.</p></div></section>
    <section className="py-16"><div className="container max-w-5xl"><div className="grid md:grid-cols-3 gap-6">
      <Card><CardContent className="p-6"><Smartphone className="h-7 w-7 text-primary mb-4" /><h2 className="font-semibold text-lg mb-2">M-Pesa</h2><p className="text-muted-foreground">Pay securely in KES using the supported M-Pesa payment flow.</p></CardContent></Card>
      <Card><CardContent className="p-6"><ShieldCheck className="h-7 w-7 text-primary mb-4" /><h2 className="font-semibold text-lg mb-2">Escrow Protection</h2><p className="text-muted-foreground">For accepted tasks, funds are held until the agreed work is completed and approved.</p></CardContent></Card>
      <Card><CardContent className="p-6"><Wallet className="h-7 w-7 text-primary mb-4" /><h2 className="font-semibold text-lg mb-2">Get Paid</h2><p className="text-muted-foreground">Freelancers can access available earnings through the platform withdrawal process.</p></CardContent></Card>
    </div></div></section>
  </main><Footer /></div>
);
export default Payments;
