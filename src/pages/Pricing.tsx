import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pricingPlans } from "@/lib/pricingPlans";

const PricingCard = ({ plan, index }: { plan: typeof pricingPlans[0]; index: number }) => {
  const navigate = useNavigate();
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
      navigate('/app');
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
      className={`glass rounded-3xl p-8 space-y-6 hover:glow-border transition-all duration-300 group relative ${
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
        <h3 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
          {plan.displayName}
          {plan.featured && <Crown className="w-6 h-6 text-primary" />}
        </h3>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
          <span className="text-sm text-muted-foreground">{plan.priceLabel}</span>
        </div>
      </div>
      <p style={{ transform: "translateZ(15px)" }} className="text-muted-foreground">{plan.description}</p>
      <ul style={{ transform: "translateZ(10px)" }} className="space-y-3">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      <Button
        onClick={handleCTA}
        className={`w-full rounded-2xl h-12 press-effect ${
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

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 sm:px-8 py-8 max-w-4xl mx-auto space-y-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 press-effect">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", bounce: 0.15 }} className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-fluid-2xl font-extrabold font-display text-gradient">Professional Tiers</h1>
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
      </motion.div>
    </div>
  );
};

export default Pricing;
