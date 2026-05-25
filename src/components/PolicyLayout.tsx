import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import Footer from "@/components/Footer";

interface Props { title: string; description: string; children: React.ReactNode; canonical: string; }

const PolicyLayout = ({ title, description, canonical, children }: Props) => {
  const navigate = useNavigate();
  return (
    <>
      <SEO title={title} description={description} canonical={canonical} />
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 px-4 sm:px-8 py-8 max-w-3xl mx-auto w-full">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 press-effect mb-4"><ArrowLeft className="w-4 h-4" />Back</Button>
          <article className="glass rounded-3xl p-8 space-y-5 text-sm leading-7 text-muted-foreground">
            <header className="space-y-2 text-center border-b border-border pb-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">{title}</h1>
              <p className="text-xs">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
              <p className="text-[11px]">Snashco LLC · Bulawayo, Zimbabwe · tanksnash@gmail.com</p>
            </header>
            {children}
          </article>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default PolicyLayout;
