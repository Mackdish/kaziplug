import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, CheckCircle2, AlertTriangle } from "lucide-react";

const TrustSafety = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">
      <section className="gradient-hero py-16"><div className="container text-center text-primary-foreground"><Shield className="h-12 w-12 mx-auto mb-4" /><h1 className="text-4xl font-bold mb-3">Trust & Safety</h1><p className="text-primary-foreground/80 max-w-2xl mx-auto">Tools and policies designed to make working on NextGig safer for clients and freelancers.</p></div></section>
      <section className="py-16"><div className="container max-w-5xl"><div className="grid md:grid-cols-2 gap-6">
        <Card><CardContent className="p-6"><Lock className="h-7 w-7 text-primary mb-4" /><h2 className="text-xl font-semibold mb-2">Secure Payments</h2><p className="text-muted-foreground">Payments for accepted work are protected through our escrow workflow and released when the client approves completed work.</p></CardContent></Card>
        <Card><CardContent className="p-6"><CheckCircle2 className="h-7 w-7 text-primary mb-4" /><h2 className="text-xl font-semibold mb-2">Verified Profiles</h2><p className="text-muted-foreground">Review freelancer profiles, skills, proposals and platform activity before choosing who to work with.</p></CardContent></Card>
        <Card><CardContent className="p-6"><Shield className="h-7 w-7 text-primary mb-4" /><h2 className="text-xl font-semibold mb-2">Fair Marketplace</h2><p className="text-muted-foreground">Keep communication and transactions on NextGig where possible, follow agreed project terms and document important decisions.</p></CardContent></Card>
        <Card><CardContent className="p-6"><AlertTriangle className="h-7 w-7 text-primary mb-4" /><h2 className="text-xl font-semibold mb-2">Report Problems</h2><p className="text-muted-foreground">If you encounter suspicious activity, payment issues or a serious dispute, contact our support team promptly.</p></CardContent></Card>
      </div></div></section>
    </main>
    <Footer />
  </div>
);

export default TrustSafety;
