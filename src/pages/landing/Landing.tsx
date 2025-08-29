
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PlansSection } from "@/components/landing/PlansSection";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Landing = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Button asChild className="bg-bonina hover:bg-bonina/90">
              <Link to="/inbox">Ir para App</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild className="bg-bonina hover:bg-bonina/90">
                <Link to="/register">Registrar</Link>
              </Button>
            </>
          )}
        </div>
      </Header>
      
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <PlansSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Landing;
