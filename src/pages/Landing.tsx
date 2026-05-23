import { motion, useScroll, useSpring, useTransform, useMotionValue } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, Zap, Shield, ArrowRight, ChevronRight, Users, BarChart3, Lock, Crown, Star, Heart, ExternalLink, Target, Award, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { pricingPlans } from "@/lib/pricingPlans";


const features = [
  {
    icon: <Target className="w-6 h-6" />,
    title: "Strategic AI Advisory",
    desc: "Transform your professional narrative into high-impact LinkedIn content that drives engagement and builds authority.",
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: "Brand Authority Audit",
    desc: "Comprehensive analysis of your LinkedIn presence with actionable insights to maximize your professional impact.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Executive Workflow Tools",
    desc: "Advanced content generation, scheduling, and analytics designed for high-stakes personal branding.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Content Vault & Distribution",
    desc: "Secure your strategic narratives and deploy them through intelligent scheduling for maximum reach.",
  },
];

const howItWorks = [
  { step: "1", title: "Link Your LinkedIn Profile", desc: "Connect your professional presence for a comprehensive authority assessment." },
  { step: "2", title: "Receive Strategic Insights", desc: "Get executive-level recommendations to elevate your brand positioning." },
  { step: "3", title: "Generate Authority Content", desc: "Create compelling narratives tailored to your industry and audience." },
  { step: "4", title: "Deploy & Analyze", desc: "Schedule your content and track performance with advanced analytics." },
];

const testimonials = [
  { name: "Executive Consultant", text: "ClippedIn transformed my LinkedIn strategy. My engagement increased 300% and I've secured 5 major consulting contracts.", rating: 5 },
  { name: "Tech Entrepreneur", text: "The authority audit gave me precise insights. Now my profile attracts high-value connections and opportunities.", rating: 5 },
  { name: "Marketing Director", text: "Professional-grade content generation. ClippedIn understands executive communication like no other tool.", rating: 5 },
];

const FeatureCard = ({ f, i }: { f: typeof features[0]; i: number }) => {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [0, 1], [10, -10]);
  const rotateY = useTransform(mouseXSpring, [0, 1], [-10, 10]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: "1000px" }}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.15 } }
      }}
      className="glass rounded-3xl p-6 sm:p-8 space-y-3 hover:glow-border transition-all duration-300 group"
    >
      <div style={{ transform: "translateZ(50px)" }} className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center text-primary">
        {f.icon}
      </div>
      <h3 style={{ transform: "translateZ(30px)" }} className="text-fluid-lg font-bold font-display text-foreground">{f.title}</h3>
      <p style={{ transform: "translateZ(20px)" }} className="text-fluid-sm text-muted-foreground leading-relaxed">{f.desc}</p>
    </motion.div>
  );
};

const PricingCard = ({ plan, index }: { plan: typeof pricingPlans[0]; index: number }) => {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [0, 1], [15, -15]);
  const rotateY = useTransform(mouseXSpring, [0, 1], [-15, 15]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  const handleCTA = () => {
    if (plan.checkoutUrl) {
      window.open(plan.checkoutUrl, '_blank');
    } else {
      // For free plan, navigate to app
    }
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: "1000px"
      }}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.15 } }
      }}
      className={`glass rounded-3xl p-6 space-y-4 hover:glow-border transition-all duration-300 group relative ${
        plan.highlight ? 'ring-2 ring-primary/50 shadow-2xl' : ''
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
          {plan.badge}
        </div>
      )}
      {plan.name === 'GROWTH' && (
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0px rgba(59, 130, 246, 0.5)",
              "0 0 0 10px rgba(59, 130, 246, 0)",
            ],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-3xl pointer-events-none"
        />
      )}
      <div style={{ transform: "translateZ(20px)" }}>
        <h3 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
          {plan.displayName}
          {plan.featured && <Crown className="w-5 h-5 text-primary" />}
        </h3>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
          <span className="text-sm text-muted-foreground">{plan.priceLabel}</span>
        </div>
      </div>
      <p style={{ transform: "translateZ(15px)" }} className="text-sm text-muted-foreground">{plan.description}</p>
      <ul style={{ transform: "translateZ(10px)" }} className="space-y-2 text-sm text-muted-foreground">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      <Button
        onClick={handleCTA}
        className={`w-full rounded-2xl h-11 press-effect ${
          plan.checkoutUrl
            ? 'bg-primary hover:bg-primary/90'
            : 'bg-secondary hover:bg-secondary/80 text-foreground'
        }`}
        style={{ transform: "translateZ(25px)" }}
      >
        {plan.cta}
      </Button>
      <p style={{ transform: "translateZ(5px)" }} className="text-xs text-muted-foreground text-center">{plan.trust}</p>
    </motion.div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const { scrollY, scrollYProgress } = useScroll();
  
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="min-h-screen overflow-x-hidden">
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left z-[100]" style={{ scaleX }} />
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-black text-2xl leading-none">C.</span>
          </div>
          <span className="text-fluid-lg font-extrabold font-display text-gradient brand-logo">ClippedIn</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
          <button onClick={() => navigate("/about")} className="hover:text-foreground transition-colors">About</button>
          <button onClick={() => navigate("/pricing")} className="hover:text-foreground transition-colors">Pricing</button>
          <button onClick={() => navigate("/faqs")} className="hover:text-foreground transition-colors">FAQs</button>
          <button onClick={() => navigate("/contact")} className="hover:text-foreground transition-colors">Contact</button>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="text-muted-foreground hover:text-foreground press-effect">
            Sign In
          </Button>
          <Button size="sm" onClick={() => navigate("/app")} className="rounded-2xl bg-primary hover:bg-primary/90 press-effect gap-1.5">
            Get Started <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-4 sm:px-8 pt-16 sm:pt-24 pb-16 text-center max-w-4xl mx-auto min-h-[70vh] flex flex-col items-center justify-center">
        {/* Animated Accent - The Live Badge */}
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0px hsla(var(--primary), 0.4)",
              "0 0 0 8px hsla(var(--primary), 0)"
            ],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut"
          }}
          className="absolute top-4 right-4 sm:top-8 sm:right-8 px-3 py-1 bg-primary/10 backdrop-blur-md rounded-full text-[10px] font-bold text-primary flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 bg-primary rounded-full" />
          LIVE
        </motion.div>

        <div className="space-y-6 w-full">
          {/* Static Container - Title renders immediately for better LCP */}
          <div className="relative space-y-6">
            {/* Background Gradient Glow */}
            <motion.div 
              style={{ y: backgroundY }}
              className="absolute -inset-x-20 -top-20 -bottom-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-primary/5 to-transparent blur-3xl -z-10 pointer-events-none" 
            />
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs text-muted-foreground">
              <Crown className="w-3.5 h-3.5 text-primary" />
              Professional Authority Platform
            </div>
            <h1 className="text-fluid-3xl font-extrabold font-display leading-tight">
              Own Your <span className="text-gradient">Influence</span>.
            </h1>
          </div>

          {/* Animated Accent Group - Fades and slides in after a short delay */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            className="space-y-6"
          >
            <p className="text-fluid-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The AI content engine and authority audit built for LinkedIn operators who want to post sharper, faster, and on-brand — every single day.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button
                size="lg"
                onClick={() => navigate("/app")}
                className="rounded-2xl bg-primary hover:bg-primary/90 text-lg px-8 h-12 press-effect gap-2"
              >
                Start Creating <ChevronRight className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/login")}
                className="rounded-2xl text-lg px-8 h-12 press-effect"
              >
                Sign In
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.34em] text-muted-foreground">
              <span className="rounded-full border border-border bg-background/70 px-4 py-2">Optimize</span>
              <span className="rounded-full border border-border bg-background/70 px-4 py-2">Authority</span>
              <span className="rounded-full border border-border bg-background/70 px-4 py-2">Engage</span>
              <span className="rounded-full border border-border bg-background/70 px-4 py-2">Convert</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 sm:px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl border border-border bg-background/80 p-6 shadow-xl glass">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  name: "Executive Coach",
                  image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=300&q=80"
                },
                {
                  name: "Brand Leader",
                  image: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80"
                },
                {
                  name: "Industry Analyst",
                  image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80"
                },
                {
                  name: "Corporate Founder",
                  image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"
                }
              ].map((person) => (
                <div key={person.name} className="rounded-3xl overflow-hidden border border-border bg-white/80 dark:bg-slate-900/90">
                  <img src={person.image} alt={person.name} className="h-40 w-full object-cover" />
                  <div className="px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">{person.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Trusted ClippedIn to publish more confidently.</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">Trusted by senior leaders, brand strategists, and revenue teams who need polished LinkedIn content at scale.</p>
          </div>
        </div>
      </section>

      {/* Market Insights Stats */}
      <section className="px-4 sm:px-8 py-16 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-fluid-2xl font-extrabold font-display text-foreground">Market Intelligence</h2>
            <p className="text-fluid-sm text-muted-foreground">Data-driven insights powering executive decisions</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="text-4xl font-bold text-primary"
                >
                  87%
                </motion.div>
                <p className="text-sm text-muted-foreground">of recruiters source candidates via LinkedIn</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, type: "spring" }}
                  className="text-4xl font-bold text-primary"
                >
                  14x
                </motion.div>
                <p className="text-sm text-muted-foreground">more profile views for high-authority profiles</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="text-4xl font-bold text-primary"
                >
                  1%
                </motion.div>
                <p className="text-sm text-muted-foreground">of users create 80% of LinkedIn engagement</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 sm:px-8 py-16 max-w-5xl mx-auto">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-fluid-2xl font-extrabold font-display text-foreground">Executive Features</h2>
          <p className="text-fluid-sm text-muted-foreground">Advanced tools designed for professional authority building.</p>
        </div>
        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
        >
          {features.map((f, i) => (
            <FeatureCard key={f.title} f={f} i={i} />
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="px-4 sm:px-8 py-16 max-w-4xl mx-auto">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-fluid-2xl font-extrabold font-display text-foreground">Authority Building Process</h2>
          <p className="text-fluid-sm text-muted-foreground">Strategic steps to establish your executive presence.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {howItWorks.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", bounce: 0.15 }}
              className="glass rounded-3xl p-6 flex gap-4 items-start hover:glow-border transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="text-fluid-base font-bold text-foreground">{item.title}</h3>
                <p className="text-fluid-sm text-muted-foreground mt-1">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button
            size="lg"
            onClick={() => navigate("/app")}
            className="rounded-2xl bg-primary hover:bg-primary/90 px-8 h-12 press-effect gap-2"
          >
            Try It Free <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-4 sm:px-8 py-16 max-w-5xl mx-auto">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-fluid-2xl font-extrabold font-display text-foreground">Executive Testimonials</h2>
          <p className="text-fluid-sm text-muted-foreground">Hear from professionals transforming their LinkedIn presence.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", bounce: 0.15 }}
              className="glass rounded-3xl p-6 space-y-3 hover:glow-border transition-all"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-fluid-sm text-muted-foreground italic">"{t.text}"</p>
              <p className="text-xs text-foreground font-semibold">{t.name}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="px-4 sm:px-8 py-16 max-w-6xl mx-auto">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-fluid-2xl font-extrabold font-display text-foreground">Professional Tiers</h2>
          <p className="text-fluid-sm text-muted-foreground">Choose the plan that matches your authority-building goals.</p>
        </div>
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {pricingPlans.map((plan, i) => (
            <PricingCard key={plan.name} plan={plan} index={i} />
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-8 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", bounce: 0.2 }}
          className="glass rounded-3xl p-8 sm:p-12 max-w-3xl mx-auto space-y-4 glow-border"
        >
          <h2 className="text-fluid-xl font-bold font-display text-foreground">
            Ready to establish your executive authority?
          </h2>
          <p className="text-fluid-sm text-muted-foreground">
            Join thought leaders who use ClippedIn to build compelling professional narratives.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/app")}
            className="rounded-2xl bg-primary hover:bg-primary/90 text-lg px-8 h-12 press-effect gap-2 mt-4"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </section>

      {/* Founder */}
      <section className="px-4 sm:px-8 py-12 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-6 sm:p-8 space-y-3"
        >
          <Heart className="w-6 h-6 text-rose-400 mx-auto" />
          <p className="text-fluid-sm text-muted-foreground">
            Created with ❤️ by <span className="text-foreground font-semibold">Tanaka Zinyengere</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('https://revolut.me/tanakazinyengere', '_blank')}
              className="text-muted-foreground hover:text-foreground press-effect gap-1.5"
            >
              <Heart className="w-4 h-4" />
              Support Us
            </Button>
            <a
              href="https://linkfly.to/tanksnash"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary text-sm font-medium hover:underline press-effect"
            >
              Learn more about our founder <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 sm:px-8 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-xs">C.</span>
            </div>
            <span>© {new Date().getFullYear()} ClippedIn. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <button onClick={() => navigate("/about")} className="hover:text-foreground transition-colors">About</button>
            <button onClick={() => navigate("/faqs")} className="hover:text-foreground transition-colors">FAQs</button>
            <button onClick={() => navigate("/contact")} className="hover:text-foreground transition-colors">Contact</button>
            <button onClick={() => navigate("/pricing")} className="hover:text-foreground transition-colors">Pricing</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
