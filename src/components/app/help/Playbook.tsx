import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, BookOpen, Zap, Settings, Users, TrendingUp, Shield, Workflow, MessageSquare, Calendar, Bot, Plug } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const Playbook = () => {
  const handleDownloadPDF = async () => {
    const element = document.getElementById('playbook-content');
    if (!element) return;

    toast.loading("Gerando PDF...");
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      let heightLeft = imgHeight * ratio;
      let position = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight * ratio;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio);
        heightLeft -= pdfHeight;
      }

      pdf.save('ChatViaInfra-Playbook.pdf');
      toast.success("PDF baixado com sucesso!");
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error("Erro ao gerar PDF");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com botão de download */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Playbook da Plataforma ChatViaInfra
          </h2>
          <p className="text-muted-foreground mt-1">
            Guia completo para implementação, uso e comercialização
          </p>
        </div>
        <Button onClick={handleDownloadPDF} className="gap-2">
          <Download className="h-4 w-4" />
          Baixar PDF
        </Button>
      </div>

      {/* Conteúdo do Playbook */}
      <div id="playbook-content" className="space-y-8 bg-background p-6">
        {/* 1. Visão Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              1. Visão Geral da Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">O que é ChatViaInfra?</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                ChatViaInfra é uma plataforma omnichannel completa de atendimento ao cliente, desenvolvida para empresas que buscam centralizar e automatizar suas comunicações. A solução integra múltiplos canais (WhatsApp, Telegram, Instagram, Facebook, Email e Website) em uma única interface unificada.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Diferenciais Competitivos</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Multi-tenancy nativo:</strong> Arquitetura preparada para white-label e múltiplas empresas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Agentes de IA integrados:</strong> Automação inteligente com contexto e aprendizado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Gestão unificada:</strong> Todos os canais em uma única inbox</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Agendamento integrado:</strong> Sistema de calendário e marcação de compromissos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>API completa:</strong> Integrações ilimitadas com sistemas externos</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Casos de Uso Principais</h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="border rounded-lg p-3">
                  <strong className="text-primary">Atendimento ao Cliente</strong>
                  <p className="text-muted-foreground mt-1">Suporte omnichannel com histórico completo</p>
                </div>
                <div className="border rounded-lg p-3">
                  <strong className="text-primary">Vendas e Marketing</strong>
                  <p className="text-muted-foreground mt-1">Disparo de campanhas e nutrição de leads</p>
                </div>
                <div className="border rounded-lg p-3">
                  <strong className="text-primary">Agendamento</strong>
                  <p className="text-muted-foreground mt-1">Marcação de consultas, reuniões e serviços</p>
                </div>
                <div className="border rounded-lg p-3">
                  <strong className="text-primary">Automação</strong>
                  <p className="text-muted-foreground mt-1">Bots e agentes IA para respostas 24/7</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Arquitetura Técnica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              2. Arquitetura Técnica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Stack Tecnológico</h3>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div className="border rounded-lg p-3">
                  <strong className="text-primary block mb-2">Frontend</strong>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• React 18 + TypeScript</li>
                    <li>• Tailwind CSS + Shadcn/ui</li>
                    <li>• React Router v6</li>
                    <li>• React Query (TanStack)</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-3">
                  <strong className="text-primary block mb-2">Backend</strong>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Supabase (PostgreSQL)</li>
                    <li>• Edge Functions (Deno)</li>
                    <li>• Row Level Security (RLS)</li>
                    <li>• Realtime Subscriptions</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-3">
                  <strong className="text-primary block mb-2">Integrações</strong>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Evolution API (WhatsApp)</li>
                    <li>• OpenAI GPT-4</li>
                    <li>• Webhook System</li>
                    <li>• RESTful APIs</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Modelo de Dados</h3>
              <p className="text-sm text-muted-foreground mb-3">
                A plataforma utiliza um modelo multi-tenant com isolamento por company_id:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>companies:</strong> Empresas/clientes da plataforma</li>
                <li>• <strong>profiles:</strong> Usuários vinculados a empresas</li>
                <li>• <strong>contacts:</strong> Contatos/leads dos clientes</li>
                <li>• <strong>conversations:</strong> Conversas ativas por canal</li>
                <li>• <strong>messages:</strong> Mensagens trocadas</li>
                <li>• <strong>agents:</strong> Agentes de IA configurados</li>
                <li>• <strong>bots:</strong> Fluxos de automação</li>
                <li>• <strong>whatsapp_instances:</strong> Instâncias WhatsApp conectadas</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Segurança</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>RLS (Row Level Security):</strong> Isolamento automático por empresa</li>
                <li>• <strong>JWT Authentication:</strong> Autenticação segura via Supabase Auth</li>
                <li>• <strong>RBAC:</strong> Controle de permissões por papel (admin, atendente, supervisor)</li>
                <li>• <strong>HTTPS/TLS:</strong> Todas as comunicações criptografadas</li>
                <li>• <strong>LGPD Compliant:</strong> Conformidade com lei de proteção de dados</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 3. Funcionalidades Principais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-primary" />
              3. Funcionalidades Principais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Inbox Unificado</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Todos os canais em uma interface</li>
                  <li>• Filtros por status, canal e atendente</li>
                  <li>• Atribuição manual ou automática</li>
                  <li>• Histórico completo de conversas</li>
                  <li>• Envio de texto, imagens e anexos</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Agentes de IA</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Criação de agentes personalizados</li>
                  <li>• Base de conhecimento customizável</li>
                  <li>• Processamento de linguagem natural</li>
                  <li>• Escalação para atendente humano</li>
                  <li>• Métricas de desempenho</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Agenda Integrada</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Calendário mensal/semanal/diário</li>
                  <li>• Agendamento via chat</li>
                  <li>• Links de reserva públicos</li>
                  <li>• Notificações automáticas</li>
                  <li>• Integração com Google Calendar</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Plug className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Canais Conectados</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• WhatsApp (via Evolution API)</li>
                  <li>• Telegram Bot</li>
                  <li>• Instagram Direct</li>
                  <li>• Facebook Messenger</li>
                  <li>• Email SMTP/IMAP</li>
                  <li>• Widget para Website</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Gestão de Equipe</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Múltiplos usuários por empresa</li>
                  <li>• Departamentos customizáveis</li>
                  <li>• Controle de permissões (RBAC)</li>
                  <li>• Status de presença (online/away/busy)</li>
                  <li>• Chat interno entre atendentes</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Dashboard & Analytics</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Métricas de atendimento em tempo real</li>
                  <li>• Distribuição por canal</li>
                  <li>• Tempo médio de resposta</li>
                  <li>• Taxa de resolução</li>
                  <li>• Exportação de relatórios</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Modelo Comercial */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              4. Modelo Comercial e Precificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2 text-primary">Investimento Inicial</h3>
              <p className="text-2xl font-bold mb-2">R$ 1.590,00</p>
              <p className="text-sm text-muted-foreground">
                Setup único incluindo: configuração completa da plataforma, treinamento da equipe, 
                integração de 1 canal WhatsApp, personalização de cores/logo e suporte técnico durante implantação.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Planos Mensais</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="text-center mb-3">
                    <h4 className="font-bold text-lg">Inicial</h4>
                    <p className="text-3xl font-bold text-primary mt-2">R$ 97</p>
                    <p className="text-sm text-muted-foreground">/mês</p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Central de atendimento (Inbox)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Até 3 canais de comunicação</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>1.000 contatos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Histórico de 30 dias</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Widget básico para site</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>1 usuário</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Suporte por email</span>
                    </li>
                  </ul>
                </div>

                <div className="border-2 border-primary rounded-lg p-4 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
                    MAIS POPULAR
                  </div>
                  <div className="text-center mb-3">
                    <h4 className="font-bold text-lg">Intermediário</h4>
                    <p className="text-3xl font-bold text-primary mt-2">R$ 197</p>
                    <p className="text-sm text-muted-foreground">/mês</p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Tudo do plano Inicial</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Agenda integrada</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Disparo para lista</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>5.000 contatos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Histórico de 90 dias</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Widget personalizado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Até 3 usuários</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Suporte prioritário</span>
                    </li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="text-center mb-3">
                    <h4 className="font-bold text-lg">Avançado</h4>
                    <p className="text-3xl font-bold text-primary mt-2">R$ 397</p>
                    <p className="text-sm text-muted-foreground">/mês</p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Tudo do plano Intermediário</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Agentes de IA (1 incluso)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Até 5 canais</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Contatos ilimitados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Histórico ilimitado</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>API completa</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Até 10 usuários</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Suporte 24/7</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span className="text-xs">Agentes IA adicionais: R$ 97/mês cada</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Modelo de Receita Recorrente</h3>
              <p className="text-sm text-muted-foreground mb-3">
                A plataforma opera sob modelo SaaS com receita recorrente mensal (MRR). Exemplo de projeção:
              </p>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <strong className="block text-primary mb-1">10 Clientes</strong>
                  <p className="text-muted-foreground">MRR: R$ 1.970 a R$ 3.970</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <strong className="block text-primary mb-1">50 Clientes</strong>
                  <p className="text-muted-foreground">MRR: R$ 9.850 a R$ 19.850</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <strong className="block text-primary mb-1">100 Clientes</strong>
                  <p className="text-muted-foreground">MRR: R$ 19.700 a R$ 39.700</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Configuração e Deployment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              5. Guia de Configuração e Deployment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Pré-requisitos</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Conta Supabase (ou instância self-hosted)</li>
                <li>• Servidor Evolution API (para WhatsApp)</li>
                <li>• Domínio próprio (recomendado)</li>
                <li>• Certificado SSL válido</li>
                <li>• Node.js 18+ para desenvolvimento local</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Passo a Passo - Setup Inicial</h3>
              <ol className="space-y-3 text-sm">
                <li>
                  <strong className="text-primary">1. Configurar Supabase</strong>
                  <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                    <li>• Criar projeto no Supabase</li>
                    <li>• Executar migrations do diretório <code className="bg-muted px-1 rounded">supabase/migrations/</code></li>
                    <li>• Configurar autenticação (email, Google, etc)</li>
                    <li>• Criar buckets de storage: <code className="bg-muted px-1 rounded">chat-attachments</code></li>
                  </ul>
                </li>
                <li>
                  <strong className="text-primary">2. Configurar Evolution API</strong>
                  <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                    <li>• Instalar Evolution API em servidor dedicado</li>
                    <li>• Gerar API Key de autenticação</li>
                    <li>• Configurar webhooks para URL da plataforma</li>
                    <li>• Criar primeira instância WhatsApp</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-primary">3. Configurar Variáveis de Ambiente</strong>
                  <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                    <li>• <code className="bg-muted px-1 rounded">VITE_SUPABASE_URL</code></li>
                    <li>• <code className="bg-muted px-1 rounded">VITE_SUPABASE_ANON_KEY</code></li>
                    <li>• <code className="bg-muted px-1 rounded">EVOLUTION_API_URL</code></li>
                    <li>• <code className="bg-muted px-1 rounded">EVOLUTION_API_KEY</code></li>
                    <li>• <code className="bg-muted px-1 rounded">OPENAI_API_KEY</code> (para agentes IA)</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-primary">4. Deploy da Aplicação</strong>
                  <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                    <li>• Build do frontend: <code className="bg-muted px-1 rounded">npm run build</code></li>
                    <li>• Deploy em Vercel, Netlify ou servidor próprio</li>
                    <li>• Configurar domínio e SSL</li>
                    <li>• Deploy das Edge Functions no Supabase</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-primary">5. Criar Primeira Empresa</strong>
                  <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                    <li>• Acessar <code className="bg-muted px-1 rounded">/setup-users</code></li>
                    <li>• Criar empresa e primeiro usuário admin</li>
                    <li>• Conectar primeiro canal (WhatsApp)</li>
                    <li>• Configurar widget do site</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Infraestrutura Recomendada</h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="border rounded-lg p-3">
                  <strong className="text-primary block mb-2">Desenvolvimento</strong>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Supabase Free Tier</li>
                    <li>• Evolution API local</li>
                    <li>• Testes com números sandbox</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-3">
                  <strong className="text-primary block mb-2">Produção (até 50 clientes)</strong>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Supabase Pro (US$ 25/mês)</li>
                    <li>• VPS 4GB RAM para Evolution</li>
                    <li>• CDN para frontend (Vercel/Netlify)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 6. Melhores Práticas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              6. Melhores Práticas de Uso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Gestão de Atendimento</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Defina SLAs claros:</strong> Tempo máximo de primeira resposta e resolução</li>
                <li>• <strong>Use departamentos:</strong> Separe equipes por especialização (vendas, suporte, financeiro)</li>
                <li>• <strong>Rotação de atendimento:</strong> Distribua conversas uniformemente entre atendentes</li>
                <li>• <strong>Resolva conversas:</strong> Sempre marque conversas como resolvidas para manter inbox limpo</li>
                <li>• <strong>Notas internas:</strong> Use anotações para contextualizar atendentes sobre histórico</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Automação Inteligente</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Bots para triagem:</strong> Use bots para qualificar leads antes de enviar para humanos</li>
                <li>• <strong>Agentes IA contextualizados:</strong> Treine agentes com base de conhecimento específica</li>
                <li>• <strong>Horário de expediente:</strong> Configure respostas automáticas fora do horário</li>
                <li>• <strong>Escalação clara:</strong> Defina gatilhos para transferir de bot para humano</li>
                <li>• <strong>Teste antes de ativar:</strong> Sempre teste fluxos em ambiente controlado</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Segurança e Privacidade</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Senhas fortes:</strong> Exija senhas complexas e rotação periódica</li>
                <li>• <strong>2FA para admins:</strong> Ative autenticação de dois fatores para usuários admin</li>
                <li>• <strong>Auditoria de logs:</strong> Revise regularmente logs de acesso e ações</li>
                <li>• <strong>Backup diário:</strong> Configure backups automáticos do banco de dados</li>
                <li>• <strong>LGPD:</strong> Implemente política de exclusão de dados mediante solicitação</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Performance e Escalabilidade</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Limpeza de histórico:</strong> Archive conversas antigas (&gt;90 dias) em planos básicos</li>
                <li>• <strong>Limite de anexos:</strong> Defina tamanho máximo de arquivos (recomendado: 10MB)</li>
                <li>• <strong>Monitoring:</strong> Use ferramentas de APM para monitorar performance</li>
                <li>• <strong>Cache estratégico:</strong> Implemente cache de queries frequentes</li>
                <li>• <strong>Escalonamento:</strong> Planeje upgrade de infra ao atingir 70% de capacidade</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* 7. Fluxos de Uso Comuns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-primary" />
              7. Fluxos de Uso Comuns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Fluxo 1: Atendimento Humano via WhatsApp</h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>1. Cliente envia mensagem no WhatsApp conectado</li>
                <li>2. Webhook recebe mensagem e cria/atualiza conversa no sistema</li>
                <li>3. Conversa aparece na inbox do atendente</li>
                <li>4. Atendente responde através da plataforma</li>
                <li>5. Mensagem é enviada via Evolution API para WhatsApp do cliente</li>
                <li>6. Conversa é marcada como resolvida após conclusão</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Fluxo 2: Atendimento com Agente IA</h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>1. Cliente inicia conversa em qualquer canal</li>
                <li>2. Bot/Agente IA responde automaticamente baseado em contexto</li>
                <li>3. IA consulta base de conhecimento para gerar resposta</li>
                <li>4. Se não conseguir resolver, aciona gatilho de escalação</li>
                <li>5. Conversa é transferida para atendente humano com histórico completo</li>
                <li>6. Métricas são registradas (taxa de resolução, satisfação, etc)</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Fluxo 3: Agendamento via Chat</h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>1. Cliente solicita agendamento através do chat</li>
                <li>2. Atendente ou bot compartilha link da agenda pública</li>
                <li>3. Cliente escolhe data/horário disponível</li>
                <li>4. Sistema cria evento no calendário e envia confirmação</li>
                <li>5. Notificações automáticas são enviadas (1 dia antes, 1 hora antes)</li>
                <li>6. Cliente pode reagendar ou cancelar através do link recebido</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Fluxo 4: Disparo em Massa</h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>1. Marketing seleciona lista de contatos na plataforma</li>
                <li>2. Cria campanha com template de mensagem personalizada</li>
                <li>3. Sistema valida conformidade (opt-in, horário permitido, etc)</li>
                <li>4. Disparo é agendado ou executado imediatamente</li>
                <li>5. Mensagens são enviadas respeitando rate limit da API</li>
                <li>6. Relatório de entrega/leitura é gerado automaticamente</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* 8. Manutenção e Suporte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              8. Manutenção e Suporte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Rotina de Manutenção</h3>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div className="border rounded-lg p-3">
                  <strong className="text-primary block mb-2">Diária</strong>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Verificar logs de erro</li>
                    <li>• Monitorar uso de recursos</li>
                    <li>• Revisar conversas pendentes</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-3">
                  <strong className="text-primary block mb-2">Semanal</strong>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Backup manual de segurança</li>
                    <li>• Análise de métricas</li>
                    <li>• Atualização de base de conhecimento IA</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-3">
                  <strong className="text-primary block mb-2">Mensal</strong>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Atualização de dependências</li>
                    <li>• Revisão de segurança</li>
                    <li>• Limpeza de dados antigos</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Troubleshooting Comum</h3>
              <div className="space-y-3 text-sm">
                <div className="border-l-4 border-primary pl-3">
                  <strong className="text-primary">WhatsApp desconectado</strong>
                  <p className="text-muted-foreground mt-1">
                    • Verificar status da instância na Evolution API<br/>
                    • Reconectar através da página de Canais<br/>
                    • Gerar novo QR Code se necessário
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-3">
                  <strong className="text-primary">Mensagens não chegando</strong>
                  <p className="text-muted-foreground mt-1">
                    • Validar configuração de webhook<br/>
                    • Verificar logs da Edge Function evolution-webhook<br/>
                    • Confirmar conectividade entre Evolution API e Supabase
                  </p>
                </div>
                <div className="border-l-4 border-primary pl-3">
                  <strong className="text-primary">Agente IA não respondendo</strong>
                  <p className="text-muted-foreground mt-1">
                    • Verificar saldo/créditos da API OpenAI<br/>
                    • Revisar configuração do agente (contexto, prompts)<br/>
                    • Checar logs da Edge Function chat-bot
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Canais de Suporte</h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="border rounded-lg p-3">
                  <strong className="text-primary block mb-2">Para Clientes Finais</strong>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Email: suporte@chatviainfra.com</li>
                    <li>• WhatsApp: (11) 94002-7215</li>
                    <li>• Base de conhecimento integrada</li>
                    <li>• SLA: 4h úteis (plano Inicial)</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-3">
                  <strong className="text-primary block mb-2">Para Parceiros/Revendedores</strong>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Slack workspace dedicado</li>
                    <li>• Reunião semanal de alinhamento</li>
                    <li>• Documentação técnica completa</li>
                    <li>• SLA: 2h úteis (prioritário)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 9. Roadmap e Implementações Futuras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              9. Roadmap e Implementações Futuras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Curto Prazo (1-3 meses)</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Templates de mensagem:</strong> Respostas rápidas customizáveis por equipe</li>
                <li>• <strong>Relatórios avançados:</strong> Dashboard com insights de IA e recomendações</li>
                <li>• <strong>CRM básico:</strong> Gestão de pipeline de vendas integrada às conversas</li>
                <li>• <strong>App mobile:</strong> Aplicativo nativo para iOS e Android (atendentes)</li>
                <li>• <strong>Integração Zapier:</strong> Conectar com 5.000+ aplicações</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Médio Prazo (3-6 meses)</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Chamadas de voz/vídeo:</strong> Atendimento por videochamada integrada</li>
                <li>• <strong>Marketplace de bots:</strong> Loja de fluxos prontos para venda/compra</li>
                <li>• <strong>IA generativa de imagens:</strong> Criação automática de artes para campanhas</li>
                <li>• <strong>Multi-idioma:</strong> Interface e agentes IA em inglês, espanhol e português</li>
                <li>• <strong>White-label completo:</strong> Personalização total de marca para revendedores</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Longo Prazo (6-12 meses)</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Análise de sentimento em tempo real:</strong> IA detectando frustração/satisfação do cliente</li>
                <li>• <strong>Co-pilot para atendentes:</strong> IA sugerindo respostas enquanto atendente digita</li>
                <li>• <strong>Integrações ERP:</strong> SAP, Totvs, Omie para gestão unificada</li>
                <li>• <strong>Compliance automático:</strong> Sistema de conformidade com LGPD/GDPR embutido</li>
                <li>• <strong>Modo offline:</strong> Aplicativo funcionando sem internet com sincronização posterior</li>
              </ul>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold text-primary mb-2">Contribuições da Comunidade</h3>
              <p className="text-sm text-muted-foreground">
                Incentivamos parceiros e clientes a sugerirem funcionalidades através do nosso portal de ideias. 
                As sugestões mais votadas entram no roadmap prioritário. Desenvolvedores também podem contribuir 
                com código através do repositório GitHub.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 10. Pontos de Atenção Críticos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              10. Pontos de Atenção Críticos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <h3 className="font-semibold text-destructive mb-3">⚠️ Limitações Técnicas</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>WhatsApp Business API oficial:</strong> Requer aprovação do Meta (processo de 2-4 semanas)</li>
                <li>• <strong>Rate limits:</strong> Evolution API tem limites de mensagens/segundo (padrão: 15/min)</li>
                <li>• <strong>Números bloqueados:</strong> WhatsApp pode banir números com uso irregular (spam)</li>
                <li>• <strong>Sessão do WhatsApp:</strong> Pode desconectar após 14 dias sem uso</li>
                <li>• <strong>Dependência de terceiros:</strong> Meta, OpenAI e Evolution API são serviços de terceiros</li>
              </ul>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-amber-600 mb-3">⚡ Aspectos Legais e Compliance</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Opt-in obrigatório:</strong> Cliente deve consentir em receber mensagens (LGPD)</li>
                <li>• <strong>Horário de disparo:</strong> Respeitar horários permitidos (8h-20h em dias úteis)</li>
                <li>• <strong>Direito ao esquecimento:</strong> Sistema deve permitir exclusão completa de dados</li>
                <li>• <strong>Termo de uso:</strong> Clientes devem aceitar termos antes de usar agentes IA</li>
                <li>• <strong>Gravação de conversas:</strong> Informar usuários sobre armazenamento de mensagens</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">🔒 Segurança e Vulnerabilidades</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>API Keys expostas:</strong> Nunca commitar chaves no Git (usar .env e secrets)</li>
                <li>• <strong>XSS e Injection:</strong> Sanitizar sempre inputs de usuários antes de renderizar</li>
                <li>• <strong>RLS mal configurado:</strong> Testar isolamento entre empresas (company_id)</li>
                <li>• <strong>Permissões de storage:</strong> Validar que usuários só acessam arquivos próprios</li>
                <li>• <strong>Webhooks não autenticados:</strong> Validar origem de requisições em endpoints públicos</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">💰 Custos Operacionais Variáveis</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>OpenAI API:</strong> Custos variam por volume de tokens (US$ 0,002-0,03 por 1K tokens)</li>
                <li>• <strong>Supabase:</strong> Cobranças por storage, bandwidth e compute após free tier</li>
                <li>• <strong>Servidor Evolution:</strong> VPS escala conforme número de instâncias WhatsApp</li>
                <li>• <strong>SMS/Voice:</strong> Se implementar verificação por SMS, custo por envio</li>
                <li>• <strong>Margem de segurança:</strong> Recomendado provisionar 30% acima da demanda esperada</li>
              </ul>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="font-semibold text-blue-600 mb-2">💡 Recomendações Finais</h3>
              <p className="text-sm text-muted-foreground">
                Antes de escalar operação comercial, recomendamos período de beta com 5-10 clientes piloto para 
                validar estabilidade, identificar gargalos e ajustar processos. Invista em documentação e treinamento 
                de equipe desde o início. Mantenha comunicação transparente com clientes sobre limitações e 
                atualizações planejadas.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer do Playbook */}
        <div className="text-center pt-6 border-t">
          <p className="text-sm text-muted-foreground">
            Playbook ChatViaInfra v1.0 | Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Para dúvidas ou sugestões sobre este documento, entre em contato via suporte@chatviainfra.com
          </p>
        </div>
      </div>
    </div>
  );
};