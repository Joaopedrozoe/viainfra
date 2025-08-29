import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
export const HeroSection = () => {
  return <section className="relative overflow-hidden py-20 md:py-28 hero-pattern">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">Um chat para todos os seus canais de atendimento</h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">WhatsApp, Instagram, Messenger, Telegram e até o chat do seu site. 

Tudo em um só lugar!</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild className="bg-bonina hover:bg-bonina/90 text-white px-8 py-6 text-lg" size="lg">
              <Link to="/register">Teste Grátis por 7 Dias</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg">
              <Link to="/login">Entrar</Link>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-bonina/5 rounded-full"></div>
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-bonina/5 rounded-full"></div>
    </section>;
};
export default HeroSection;