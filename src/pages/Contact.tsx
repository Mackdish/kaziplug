import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Mail, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Contact = () => (
  <div className="min-h-screen flex flex-col"><Header /><main className="flex-1"><section className="gradient-hero py-16"><div className="container text-center text-primary-foreground"><h1 className="text-4xl font-bold mb-3">Contact NextGig</h1><p className="text-primary-foreground/80 max-w-2xl mx-auto">Need help with your account, task, bid or payment? Our support team is here to help.</p></div></section><section className="py-16"><div className="container max-w-3xl grid sm:grid-cols-2 gap-6"><Card><CardContent className="p-7"><Mail className="h-7 w-7 text-primary mb-4" /><h2 className="font-semibold text-lg mb-2">Email Support</h2><a className="text-primary hover:underline" href="mailto:support@nextgig.co.ke">support@nextgig.co.ke</a></CardContent></Card><Card><CardContent className="p-7"><MapPin className="h-7 w-7 text-primary mb-4" /><h2 className="font-semibold text-lg mb-2">Location</h2><p className="text-muted-foreground">Nairobi, Kenya</p></CardContent></Card></div></section></main><Footer /></div>
);
export default Contact;
