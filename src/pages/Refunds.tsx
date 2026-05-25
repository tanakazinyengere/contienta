import PolicyLayout from "@/components/PolicyLayout";
const Refunds = () => (
  <PolicyLayout title="Refund Policy" description="ClippedIn refund policy for digital subscriptions." canonical="https://clippedin.lovable.app/refunds">
    <section><h2 className="text-foreground font-bold text-base">Digital goods</h2><p>ClippedIn is a digital service. Subscription payments are generally non-refundable once a billing period has started.</p></section>
    <section><h2 className="text-foreground font-bold text-base">EU consumers — 14-day right of withdrawal</h2><p>If you reside in the EU/EEA you may request a full refund within 14 days of your first paid period, unless you explicitly waive that right when activating premium AI features. To request: email <a href="mailto:tanksnash@gmail.com" className="underline">tanksnash@gmail.com</a> from the account email.</p></section>
    <section><h2 className="text-foreground font-bold text-base">Service interruption</h2><p>If we cause a material service outage that prevents normal use for more than 48 hours in a billing cycle, contact support for a pro-rated credit.</p></section>
    <section><h2 className="text-foreground font-bold text-base">Chargebacks</h2><p>Initiating a chargeback without first contacting support may result in account suspension while we investigate.</p></section>
  </PolicyLayout>
);
export default Refunds;
