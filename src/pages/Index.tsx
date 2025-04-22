import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import WhyChooseSection from "@/components/WhyChooseSection";
import AllInOneAppSection from "@/components/AllInOneAppSection";
import TopTeachersSection from "@/components/TopTeachersSection";
import PopularCoursesSection from "@/components/PopularCoursesSection";
import ImpactSection from "@/components/ImpactSection";
import StudentsInActionSection from "@/components/StudentsInActionSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

const Index = () => {

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <WhyChooseSection />
      <AllInOneAppSection />
      <TopTeachersSection />
      <PopularCoursesSection />
      <ImpactSection />
      <StudentsInActionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;
