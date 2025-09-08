import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { KnowledgeBase } from "@/components/app/help/KnowledgeBase";
import { SupportChat } from "@/components/app/help/SupportChat";
import { FrontendDocumentation } from "@/components/app/help/frontend-documentation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Server, Code, Webhook, FileText } from "lucide-react";

const Help = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="p-4 md:p-6 min-h-full">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">Base de Conhecimento</h1>
        
        <Tabs defaultValue="guide" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="guide">Guia Geral</TabsTrigger>
            <TabsTrigger value="frontend">Frontend Docs</TabsTrigger>
            <TabsTrigger value="database">Banco de Dados</TabsTrigger>
            <TabsTrigger value="api">Evolution API</TabsTrigger>
            <TabsTrigger value="deployment">Deploy AWS</TabsTrigger>
          </TabsList>
          
          <TabsContent value="guide" className="space-y-4">
            <KnowledgeBase />
          </TabsContent>
          
          <TabsContent value="frontend" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentação Completa do Frontend
                </CardTitle>
                <CardDescription>
                  Especificações técnicas detalhadas para construir um backend compatível
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FrontendDocumentation />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Configuração do Banco de Dados PostgreSQL
                </CardTitle>
                <CardDescription>
                  Scripts e instruções para configurar o banco de dados em produção
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">1. Executar Script de Criação</h3>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <code className="text-sm">
                      psql -h localhost -U postgres -d whitelabel_mvp -f database-setup.sql
                    </code>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Execute o arquivo <code>database-setup.sql</code> que contém todas as tabelas necessárias.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">2. Tabelas Principais</h3>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>companies</strong> - Empresas (multi-tenant)</li>
                    <li>• <strong>users</strong> - Usuários do sistema</li>
                    <li>• <strong>channels</strong> - Canais de comunicação (WhatsApp, etc)</li>
                    <li>• <strong>bots</strong> - Bots e fluxos de automação</li>
                    <li>• <strong>contacts</strong> - Contatos dos clientes</li>
                    <li>• <strong>conversations</strong> - Conversas ativas</li>
                    <li>• <strong>messages</strong> - Mensagens das conversas</li>
                    <li>• <strong>tickets</strong> - Chamados/tickets de suporte</li>
                    <li>• <strong>webhook_events</strong> - Eventos recebidos via webhook</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">3. Variáveis de Ambiente</h3>
                  <div className="bg-gray-100 p-4 rounded-lg text-sm">
                    <div>DATABASE_URL=postgresql://usuario:senha@host:5432/whitelabel_mvp</div>
                    <div>POSTGRES_PASSWORD=sua_senha_segura</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Integração Evolution API
                </CardTitle>
                <CardDescription>
                  Como conectar e configurar a Evolution API para WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">1. Instalação da Evolution API</h3>
                  <div className="bg-gray-100 p-4 rounded-lg text-sm">
                    <div>git clone https://github.com/EvolutionAPI/evolution-api.git</div>
                    <div>cd evolution-api</div>
                    <div>npm install</div>
                    <div>cp .env.example .env</div>
                    <div>npm run start:prod</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">2. Configuração de Webhook</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Configure o webhook para receber mensagens do WhatsApp:
                  </p>
                  <div className="bg-gray-100 p-4 rounded-lg text-sm">
                    <div>POST /instance/create</div>
                    <div className="mt-2">
                      {`{
  "instanceName": "viainfra-bot",
  "webhook": {
    "url": "https://sua-api.com/webhook/whatsapp",
    "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
  }
}`}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">3. Conectar Instância</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Gere QR Code para conectar WhatsApp:
                  </p>
                  <div className="bg-gray-100 p-4 rounded-lg text-sm">
                    <div>GET /instance/connect/viainfra-bot</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">4. Enviar Mensagens</h3>
                  <div className="bg-gray-100 p-4 rounded-lg text-sm">
                    <div>POST /message/sendText/viainfra-bot</div>
                    <div className="mt-2">
                      {`{
  "number": "5511999999999",
  "text": "Olá! Como posso ajudar?"
}`}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="deployment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Deploy na AWS EC2
                </CardTitle>
                <CardDescription>
                  Guia completo para deploy em produção na AWS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">1. Preparar Instância EC2</h3>
                  <div className="bg-gray-100 p-4 rounded-lg text-sm space-y-1">
                    <div># Atualizar sistema</div>
                    <div>sudo apt update && sudo apt upgrade -y</div>
                    <div className="mt-2"># Instalar Docker</div>
                    <div>curl -fsSL https://get.docker.com -o get-docker.sh</div>
                    <div>sudo sh get-docker.sh</div>
                    <div className="mt-2"># Instalar Docker Compose</div>
                    <div>sudo apt install docker-compose -y</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">2. Clonar e Configurar Projeto</h3>
                  <div className="bg-gray-100 p-4 rounded-lg text-sm space-y-1">
                    <div>git clone &lt;seu-repositorio&gt;</div>
                    <div>cd whitelabel-mvp</div>
                    <div className="mt-2"># Criar arquivo .env</div>
                    <div>cp .env.example .env</div>
                    <div>nano .env  # Configurar variáveis</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">3. Executar com Docker</h3>
                  <div className="bg-gray-100 p-4 rounded-lg text-sm space-y-1">
                    <div>docker-compose up -d</div>
                    <div className="mt-2"># Verificar logs</div>
                    <div>docker-compose logs -f</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">4. Configurar Nginx (Opcional)</h3>
                  <div className="bg-gray-100 p-4 rounded-lg text-sm space-y-1">
                    <div>sudo apt install nginx -y</div>
                    <div className="mt-2"># Configurar proxy reverso para domínio</div>
                    <div>sudo nano /etc/nginx/sites-available/whitelabel</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">5. SSL com Let's Encrypt</h3>
                  <div className="bg-gray-100 p-4 rounded-lg text-sm space-y-1">
                    <div>sudo apt install certbot python3-certbot-nginx -y</div>
                    <div>sudo certbot --nginx -d seu-dominio.com</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Support Chat Float Button */}
      <SupportChat />
    </div>
  );
};

export default Help;
