
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Inbox Unificada",
    description: "Gerencie mensagens de todos os canais em uma única interface, similar ao WhatsApp.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
      </svg>
    )
  },
  {
    title: "IA Integrada",
    description: "Conecte agentes de IA via webhook para automação de respostas e atendimento inteligente.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a2 2 0 00-2 2c0 .74.4 1.39 1 1.73V7h-1c-3.87 0-7 3.13-7 7v3c0 1.1.9 2 2 2h2v-2h2v2h8v-2h2v2h2c1.1 0 2-.9 2-2v-3c0-3.87-3.13-7-7-7h-1V5.73c.6-.35 1-.99 1-1.73a2 2 0 00-2-2z"></path>
        <path d="M7 12.5a.5.5 0 111 0 .5.5 0 11-1 0M17 12.5a.5.5 0 111 0 .5.5 0 11-1 0"></path>
      </svg>
    )
  },
  {
    title: "Multicanal Nativo",
    description: "Integração nativa com WhatsApp, Instagram, Messenger, Telegram, Email, SMS e mais.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2l4-4"></path>
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
    )
  },
  {
    title: "Respostas Rápidas",
    description: "Crie templates de respostas para agilizar o atendimento e manter consistência.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    )
  },
  {
    title: "Widget para Site",
    description: "Adicione um chat flutuante ao seu site, conectado diretamente à sua inbox.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"></path>
        <path d="M10 17l5-5-5-5"></path>
        <path d="M15 12H3"></path>
      </svg>
    )
  },
  {
    title: "Apps Mobile Nativos",
    description: "Aplicativos para iOS, Android e Windows para gerenciar seus atendimentos de qualquer lugar.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21a9 9 0 01-9-9 9 9 0 019-9 9 9 0 019 9 9 9 0 01-9 9z"></path>
        <path d="M12 21V3"></path>
        <path d="M12 15l-3-3m3 3l3-3"></path>
      </svg>
    )
  }
];

export const FeaturesSection = () => {
  return (
    <section className="py-20 bg-white" id="features">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Recursos Poderosos</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tudo o que você precisa para centralizar seu atendimento ao cliente em uma única plataforma.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border border-gray-200 transition-all hover:shadow-md">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-bonina/10 flex items-center justify-center text-bonina mb-4">
                  {feature.icon}
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
