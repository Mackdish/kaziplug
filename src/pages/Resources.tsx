import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, FileText, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Resources = () => (
  <div className="min-h-screen flex flex-col"><Header /><main className="flex-1">
    <section className="gradient-hero py-16"><div className="container text-center text-primary-foreground"><BookOpen className="h-12 w-12 mx-auto mb-4" /><h1 className="text-4xl font-bold mb-3">Resources</h1><p className="text-primary-foreground/80 max-w-2xl mx-auto">Guides and information to help you get the most from NextGig.</p></div></section>
    <section className="py-16"><div className="container max-w-5xl grid md:grid-cols-3 gap-6">
      <Link to="/how-it-works"><Card className="h-full hover:border-primary/50 transition-colors"><CardContent className="p-6"><BookOpen className="h-7 w-7 text-primary mb-4" /><h2 className="font-semibold text-lg mb-2">How It Works</h2><p className="text-muted-foreground">Learn how clients and freelancers use NextGig from task posting to payment.</p></CardContent></Card></Link>
      <Link to="/trust-safety"><Card className="h-full hover:border-primary/50 transition-colors"><CardContent className="p-6"><Shield className="h-7 w-7 text-primary mb-4" /><h2 className="font-semibold text-lg mb-2">Trust & Safety</h2><p className="text-muted-foreground">Understand the practices that help keep projects and payments safer.</p></CardContent></Card></Link>
      <Link to="/terms"><Card className="h-full hover:border-primary/50 transition-colors"><CardContent className="p-6"><FileText className="h-7 w-7 text-primary mb-4" /><h2 className="font-semibold text-lg mb-2">Platform Terms</h2><p className="text-muted-foreground">Review the terms that govern use of the NextGig marketplace.</p></CardContent></Card></Link>
    </div></section>
  </main><Footer /></div>
);
export default Resources;
