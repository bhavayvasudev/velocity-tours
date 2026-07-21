import MarketingNav from "./MarketingNav";
import Hero from "./sections/Hero";
import Features from "./sections/Features";
import DashboardPreview from "./sections/DashboardPreview";
import ModulesShowcase from "./sections/ModulesShowcase";
import Analytics from "./sections/Analytics";
import Testimonials from "./sections/Testimonials";
import FAQ from "./sections/FAQ";
import Footer from "./sections/Footer";

export default function LandingPage() {
  return (
    <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
      <MarketingNav />
      <Hero />
      <Features />
      <DashboardPreview />
      <ModulesShowcase />
      <Analytics />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  );
}
