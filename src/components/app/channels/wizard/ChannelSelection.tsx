import { ChannelType } from "@/types/channels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Instagram, 
  Facebook, 
  MessageCircle, 
  Mail, 
  Globe, 
  Send,
  CheckCircle
} from "lucide-react";

interface ChannelSelectionProps {
  selectedType: ChannelType | null;
  onSelect: (type: ChannelType) => void;
}

const channelOptions = [
  {
    type: 'whatsapp' as ChannelType,
    title: 'WhatsApp Business',
    description: 'Conecte com a API oficial do WhatsApp Business',
    icon: MessageCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    features: ['Mensagens automáticas', 'Templates aprovados', 'Webhook em tempo real'],
    complexity: 'Média',
    popular: true
  },
  {
    type: 'instagram' as ChannelType,
    title: 'Instagram Direct',
    description: 'Receba mensagens diretas do Instagram',
    icon: Instagram,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    features: ['DMs automáticas', 'Respostas rápidas', 'Mídia suportada'],
    complexity: 'Média'
  },
  {
    type: 'facebook' as ChannelType,
    title: 'Facebook Messenger',
    description: 'Integre com página do Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    features: ['Chat da página', 'Bot integrado', 'Análise de sentimento'],
    complexity: 'Média'
  },
  {
    type: 'email' as ChannelType,
    title: 'Email',
    description: 'Atendimento via email corporativo',
    icon: Mail,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    features: ['SMTP/IMAP', 'Templates HTML', 'Assinatura automática'],
    complexity: 'Fácil'
  },
  {
    type: 'website' as ChannelType,
    title: 'Chat do Site',
    description: 'Widget de chat para seu website',
    icon: Globe,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    features: ['Widget personalizável', 'Chat em tempo real', 'Histórico completo'],
    complexity: 'Fácil',
    popular: true
  },
  {
    type: 'telegram' as ChannelType,
    title: 'Telegram Bot',
    description: 'Bot personalizado para Telegram',
    icon: Send,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    features: ['Commands customizados', 'Inline keyboards', 'Grupos suportados'],
    complexity: 'Fácil'
  }
];

const complexityColors = {
  'Fácil': 'bg-green-100 text-green-800',
  'Média': 'bg-yellow-100 text-yellow-800',
  'Difícil': 'bg-destructive/10 text-destructive'
};

export const ChannelSelection = ({ selectedType, onSelect }: ChannelSelectionProps) => {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Escolha o tipo de canal</h3>
        <p className="text-muted-foreground">
          Selecione o canal que você deseja configurar para começar a receber mensagens.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channelOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = selectedType === option.type;
          
          return (
            <Card 
              key={option.type}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md relative",
                isSelected ? "ring-2 ring-primary shadow-md" : ""
              )}
              onClick={() => onSelect(option.type)}
            >
              {option.popular && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 bg-primary text-primary-foreground"
                >
                  Popular
                </Badge>
              )}
              
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("p-2 rounded-lg", option.bgColor)}>
                    <IconComponent className={cn("w-6 h-6", option.color)} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{option.title}</CardTitle>
                    <Badge 
                      variant="outline" 
                      className={complexityColors[option.complexity]}
                    >
                      {option.complexity}
                    </Badge>
                  </div>
                </div>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Recursos:</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {option.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-primary rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedType && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-800">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">
              {channelOptions.find(opt => opt.type === selectedType)?.title} selecionado
            </span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            Clique em "Próximo" para configurar as credenciais e parâmetros necessários.
          </p>
        </div>
      )}
    </div>
  );
};