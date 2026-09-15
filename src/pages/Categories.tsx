import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useTasks";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Briefcase } from "lucide-react";

const Categories = () => {
  const { data: categories = [], isLoading } = useCategories();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="gradient-hero py-16">
          <div className="container text-center text-primary-foreground">
            <h1 className="text-4xl font-bold mb-3">Browse Categories</h1>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto">Find freelance work or skilled talent across popular categories on NextGig.</p>
          </div>
        </section>
        <section className="py-16">
          <div className="container">
            {isLoading ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">{[1,2,3,4].map(i => <Card key={i}><CardContent className="p-6 h-32 animate-pulse" /></Card>)}</div> : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((category: any) => (
                  <Link key={category.id} to={`/marketplace?category=${encodeURIComponent(category.id)}`}>
                    <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all group">
                      <CardContent className="p-6">
                        <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4"><Briefcase className="h-5 w-5" /></div>
                        <h2 className="font-semibold text-lg">{category.name}</h2>
                        <span className="text-sm text-primary inline-flex items-center gap-1 mt-3">View tasks <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Categories;
