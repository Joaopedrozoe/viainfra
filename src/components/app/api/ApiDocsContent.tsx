
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface ApiDocsContentProps {
  activeSection: string;
}

// Code snippet component with copy button
const CodeSnippet = ({ language, code }: { language: string; code: string }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Código copiado para a área de transferência");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-800"
        onClick={handleCopy}
      >
        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        <span className="sr-only">Copiar código</span>
      </Button>
    </div>
  );
};

// Endpoint component
const Endpoint = ({
  method,
  path,
  description,
  parameters = [],
  responses = [],
  examples = {},
}: {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  responses?: Array<{
    status: number;
    description: string;
    example?: string;
  }>;
  examples?: Record<string, string>;
}) => {
  const methodColors: Record<string, string> = {
    GET: "bg-blue-100 text-blue-800",
    POST: "bg-green-100 text-green-800",
    PUT: "bg-yellow-100 text-yellow-800",
    DELETE: "bg-red-100 text-red-800",
    PATCH: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="border rounded-lg overflow-hidden mb-8">
      <div className="p-4 bg-gray-50 border-b flex items-center gap-3">
        <Badge className={methodColors[method]}>{method}</Badge>
        <code className="font-mono text-sm">{path}</code>
      </div>
      
      <div className="p-4">
        <p className="text-gray-700 mb-6">{description}</p>
        
        {parameters.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-2">Parâmetros</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-2 px-4 border-b">Nome</th>
                  <th className="text-left py-2 px-4 border-b">Tipo</th>
                  <th className="text-left py-2 px-4 border-b">Obrigatório</th>
                  <th className="text-left py-2 px-4 border-b">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {parameters.map((param) => (
                  <tr key={param.name} className="border-b">
                    <td className="py-2 px-4 font-mono">{param.name}</td>
                    <td className="py-2 px-4 font-mono text-gray-600">{param.type}</td>
                    <td className="py-2 px-4">{param.required ? "Sim" : "Não"}</td>
                    <td className="py-2 px-4">{param.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {responses.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-2">Respostas</h4>
            <div className="space-y-3">
              {responses.map((response) => (
                <div key={response.status} className="border rounded">
                  <div className="p-2 border-b bg-gray-50 font-medium">
                    Status: {response.status}
                  </div>
                  <div className="p-3">
                    <p className="mb-2">{response.description}</p>
                    {response.example && (
                      <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {response.example}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <h4 className="font-medium mb-2">Exemplos</h4>
          <Tabs defaultValue="fetch">
            <TabsList className="mb-2">
              <TabsTrigger value="fetch">Fetch</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="node">Node.js</TabsTrigger>
            </TabsList>
            
            {Object.entries(examples).map(([key, code]) => (
              <TabsContent key={key} value={key}>
                <CodeSnippet language={key} code={code} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export const ApiDocsContent = ({ activeSection }: ApiDocsContentProps) => {
  const renderContent = () => {
    // Introduction
    if (activeSection === "introduction") {
      return (
        <>
          <h1 className="text-3xl font-bold mb-6">Documentação da API</h1>
          
          <p className="text-gray-700 mb-6">
            Bem-vindo à documentação da API ChatViaInfra. Esta API permite que você integre os recursos
            do ChatViaInfra em suas aplicações, possibilitando gerenciar contatos, enviar mensagens,
            agendar eventos e interagir com agentes de IA.
          </p>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Base URL</CardTitle>
              <CardDescription>Todas as requisições devem ser feitas para o seguinte endpoint:</CardDescription>
            </CardHeader>
            <CardContent>
              <code className="bg-gray-100 p-2 rounded block font-mono">https://api.viainfra.com/v1</code>
            </CardContent>
          </Card>
          
          <h2 className="text-2xl font-bold mb-4">Primeiros Passos</h2>
          <ol className="list-decimal pl-5 space-y-2 mb-6">
            <li>Obtenha sua chave de API no painel de integrações</li>
            <li>Use a chave API para autenticar suas requisições</li>
            <li>Comece a fazer chamadas para os endpoints</li>
          </ol>
          
          <Alert className="mb-6">
            <AlertDescription>
              Mantenha sua chave API segura! Não compartilhe sua chave em repositórios públicos ou código cliente.
            </AlertDescription>
          </Alert>
        </>
      );
    }
    
    // Authentication section
    if (activeSection === "introduction-authentication") {
      return (
        <>
          <h1 className="text-3xl font-bold mb-6">Autenticação</h1>
          
          <p className="text-gray-700 mb-6">
            A API ChatViaInfra usa autenticação baseada em token. Você precisa incluir sua chave API
            em todas as requisições para autenticar-se.
          </p>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Header de Autenticação</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="bg-gray-100 p-2 rounded block font-mono">
                Authorization: Bearer sk_live_your_api_key
              </code>
            </CardContent>
          </Card>
          
          <h2 className="text-2xl font-bold mb-4">Obter sua Chave API</h2>
          <p className="text-gray-700 mb-4">
            Você pode obter sua chave API na página de Integrações do seu painel administrativo:
          </p>
          <ol className="list-decimal pl-5 space-y-2 mb-6">
            <li>Navegue até a página de Integrações</li>
            <li>Selecione a aba API</li>
            <li>Copie sua chave API existente ou gere uma nova chave</li>
          </ol>
          
          <Alert className="mb-6">
            <AlertDescription>
              Se precisar revogar sua chave atual por motivos de segurança, você pode gerar uma nova
              chave a qualquer momento, mas lembre-se de atualizar todas as suas integrações.
            </AlertDescription>
          </Alert>
          
          <h2 className="text-2xl font-bold mb-4">Exemplo de Requisição Autenticada</h2>
          
          <Tabs defaultValue="fetch">
            <TabsList className="mb-2">
              <TabsTrigger value="fetch">Fetch</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="node">Node.js</TabsTrigger>
            </TabsList>
            
            <TabsContent value="fetch">
              <CodeSnippet 
                language="javascript" 
                code={`fetch('https://api.viainfra.com/v1/contacts', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer sk_live_your_api_key',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));`} 
              />
            </TabsContent>
            
            <TabsContent value="curl">
              <CodeSnippet 
                language="bash" 
                code={`curl -X GET \\
  https://api.viainfra.com/v1/contacts \\
  -H 'Authorization: Bearer sk_live_your_api_key' \\
  -H 'Content-Type: application/json'`} 
              />
            </TabsContent>
            
            <TabsContent value="node">
              <CodeSnippet 
                language="javascript" 
                code={`const axios = require('axios');

axios({
  method: 'get',
  url: 'https://api.viainfra.com/v1/contacts',
  headers: {
    'Authorization': 'Bearer sk_live_your_api_key',
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log(response.data);
})
.catch(error => {
  console.error(error);
});`} 
              />
            </TabsContent>
          </Tabs>
        </>
      );
    }
    
    // Rate limits section
    if (activeSection === "introduction-rate-limits") {
      return (
        <>
          <h1 className="text-3xl font-bold mb-6">Limites de Requisição</h1>
          
          <p className="text-gray-700 mb-6">
            Para garantir a estabilidade e disponibilidade da API para todos os usuários, 
            aplicamos limites de taxa às requisições da API.
          </p>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Limites por Plano</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-2 px-4 border-b">Plano</th>
                    <th className="text-left py-2 px-4 border-b">Requisições/minuto</th>
                    <th className="text-left py-2 px-4 border-b">Requisições/dia</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-4">Básico</td>
                    <td className="py-2 px-4">60</td>
                    <td className="py-2 px-4">10,000</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">Profissional</td>
                    <td className="py-2 px-4">120</td>
                    <td className="py-2 px-4">50,000</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">Empresarial</td>
                    <td className="py-2 px-4">300</td>
                    <td className="py-2 px-4">150,000</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
          
          <h2 className="text-2xl font-bold mb-4">Headers de Resposta</h2>
          <p className="text-gray-700 mb-4">
            Cada resposta da API inclui headers que indicam seu uso atual e limites:
          </p>
          
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-2 px-4 border-b">Header</th>
                <th className="text-left py-2 px-4 border-b">Descrição</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-4 font-mono">X-RateLimit-Limit</td>
                <td className="py-2 px-4">Número máximo de requisições permitidas no período</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4 font-mono">X-RateLimit-Remaining</td>
                <td className="py-2 px-4">Número de requisições restantes no período atual</td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-mono">X-RateLimit-Reset</td>
                <td className="py-2 px-4">Timestamp Unix de quando o limite será reiniciado</td>
              </tr>
            </tbody>
          </table>
          
          <h2 className="text-2xl font-bold mb-4">Excedendo os Limites</h2>
          <p className="text-gray-700 mb-4">
            Se você exceder o limite de requisições, receberá um erro 429 (Too Many Requests).
            O corpo da resposta incluirá informações sobre quando você pode tentar novamente.
          </p>
          
          <CodeSnippet 
            language="json" 
            code={`{
  "error": {
    "status": 429,
    "code": "rate_limit_exceeded",
    "message": "Limite de requisições excedido",
    "retry_after": 30
  }
}`} 
          />
        </>
      );
    }
    
    // Errors section
    if (activeSection === "introduction-errors") {
      return (
        <>
          <h1 className="text-3xl font-bold mb-6">Erros</h1>
          
          <p className="text-gray-700 mb-6">
            A API ZoeChat usa códigos de status HTTP padrão para indicar o sucesso ou falha 
            de uma requisição. Os códigos no intervalo 2xx indicam sucesso, códigos 4xx indicam 
            erros no lado do cliente, e códigos 5xx indicam erros no lado do servidor.
          </p>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Formato de Erro</CardTitle>
              <CardDescription>Todas as respostas de erro seguem este formato:</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeSnippet 
                language="json" 
                code={`{
  "error": {
    "status": 400,
    "code": "invalid_request",
    "message": "Parâmetro obrigatório ausente",
    "param": "name"
  }
}`} 
              />
            </CardContent>
          </Card>
          
          <h2 className="text-2xl font-bold mb-4">Códigos de Status HTTP Comuns</h2>
          
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-2 px-4 border-b">Código</th>
                <th className="text-left py-2 px-4 border-b">Descrição</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-4">200 - OK</td>
                <td className="py-2 px-4">Requisição bem-sucedida</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4">201 - Created</td>
                <td className="py-2 px-4">Recurso criado com sucesso</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4">400 - Bad Request</td>
                <td className="py-2 px-4">Parâmetros inválidos ou ausentes</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4">401 - Unauthorized</td>
                <td className="py-2 px-4">Autenticação falhou</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4">403 - Forbidden</td>
                <td className="py-2 px-4">Permissão insuficiente para acessar o recurso</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4">404 - Not Found</td>
                <td className="py-2 px-4">Recurso não encontrado</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4">429 - Too Many Requests</td>
                <td className="py-2 px-4">Limite de taxa excedido</td>
              </tr>
              <tr>
                <td className="py-2 px-4">500 - Internal Server Error</td>
                <td className="py-2 px-4">Erro interno do servidor</td>
              </tr>
            </tbody>
          </table>
          
          <h2 className="text-2xl font-bold mb-4">Códigos de Erro Comuns</h2>
          
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-2 px-4 border-b">Código</th>
                <th className="text-left py-2 px-4 border-b">Descrição</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-4 font-mono">invalid_request</td>
                <td className="py-2 px-4">A requisição contém parâmetros inválidos ou ausentes</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4 font-mono">authentication_error</td>
                <td className="py-2 px-4">Falha na autenticação (chave API inválida)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4 font-mono">permission_denied</td>
                <td className="py-2 px-4">Sem permissão para acessar o recurso</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4 font-mono">resource_not_found</td>
                <td className="py-2 px-4">O recurso solicitado não foi encontrado</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-4 font-mono">rate_limit_exceeded</td>
                <td className="py-2 px-4">Limite de requisições excedido</td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-mono">internal_error</td>
                <td className="py-2 px-4">Erro interno do servidor</td>
              </tr>
            </tbody>
          </table>
          
          <h2 className="text-2xl font-bold mb-4">Exemplos de Erros</h2>
          
          <p className="font-medium mb-2">Autenticação inválida:</p>
          <CodeSnippet 
            language="json" 
            code={`{
  "error": {
    "status": 401,
    "code": "authentication_error",
    "message": "Chave API inválida"
  }
}`} 
          />
          
          <p className="font-medium mb-2 mt-4">Recurso não encontrado:</p>
          <CodeSnippet 
            language="json" 
            code={`{
  "error": {
    "status": 404,
    "code": "resource_not_found",
    "message": "Contato não encontrado",
    "id": "cont_123456"
  }
}`} 
          />
          
          <p className="font-medium mb-2 mt-4">Validação de dados:</p>
          <CodeSnippet 
            language="json" 
            code={`{
  "error": {
    "status": 400,
    "code": "invalid_request",
    "message": "Validação falhou",
    "errors": [
      {
        "field": "email",
        "message": "Endereço de e-mail inválido"
      },
      {
        "field": "phone",
        "message": "Número de telefone é obrigatório"
      }
    ]
  }
}`} 
          />
        </>
      );
    }
    
    // Contacts - List Contacts
    if (activeSection === "contacts-list-contacts") {
      return (
        <>
          <h1 className="text-3xl font-bold mb-6">Listar Contatos</h1>
          
          <p className="text-gray-700 mb-6">
            Este endpoint retorna uma lista paginada de todos os contatos da sua conta.
          </p>
          
          <Endpoint 
            method="GET"
            path="/contacts"
            description="Retorna uma lista paginada de contatos."
            parameters={[
              {
                name: "limit",
                type: "integer",
                required: false,
                description: "Número de contatos a serem retornados por página. Padrão: 25, Máximo: 100."
              },
              {
                name: "page",
                type: "integer",
                required: false,
                description: "Número da página para paginação. Padrão: 1."
              },
              {
                name: "sort",
                type: "string",
                required: false,
                description: "Campo para ordenação (nome, email, created_at). Padrão: created_at."
              },
              {
                name: "order",
                type: "string",
                required: false,
                description: "Ordem de classificação (asc, desc). Padrão: desc."
              },
              {
                name: "search",
                type: "string",
                required: false,
                description: "Termo de busca para filtrar contatos por nome ou email."
              }
            ]}
            responses={[
              {
                status: 200,
                description: "Uma lista de contatos foi retornada com sucesso.",
                example: `{
  "data": [
    {
      "id": "cont_abc123",
      "name": "João Silva",
      "email": "joao@exemplo.com",
      "phone": "+5511987654321",
      "created_at": "2023-05-15T14:30:00Z",
      "updated_at": "2023-05-16T10:15:00Z"
    },
    {
      "id": "cont_def456",
      "name": "Maria Souza",
      "email": "maria@exemplo.com",
      "phone": "+5511912345678",
      "created_at": "2023-05-10T09:45:00Z",
      "updated_at": "2023-05-15T11:20:00Z"
    }
  ],
  "meta": {
    "total": 125,
    "page": 1,
    "limit": 25,
    "pages": 5
  }
}`
              }
            ]}
            examples={{
              fetch: `fetch('https://api.zoechat.app/v1/contacts?limit=10&page=1&sort=name&order=asc', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer sk_live_your_api_key',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));`,
              curl: `curl -X GET \\
  'https://api.zoechat.app/v1/contacts?limit=10&page=1&sort=name&order=asc' \\
  -H 'Authorization: Bearer sk_live_your_api_key' \\
  -H 'Content-Type: application/json'`,
              node: `const axios = require('axios');

axios({
  method: 'get',
  url: 'https://api.zoechat.app/v1/contacts',
  headers: {
    'Authorization': 'Bearer sk_live_your_api_key',
    'Content-Type': 'application/json'
  },
  params: {
    limit: 10,
    page: 1,
    sort: 'name',
    order: 'asc'
  }
})
.then(response => {
  console.log(response.data);
})
.catch(error => {
  console.error(error);
});`
            }}
          />
        </>
      );
    }
    
    // Agents - List Agents
    if (activeSection === "agents-list-agents") {
      return (
        <>
          <h1 className="text-3xl font-bold mb-6">Listar Agentes</h1>
          
          <p className="text-gray-700 mb-6">
            Este endpoint retorna uma lista de todos os agentes disponíveis na sua conta.
          </p>
          
          <Endpoint 
            method="GET"
            path="/agents"
            description="Retorna uma lista de agentes."
            parameters={[
              {
                name: "limit",
                type: "integer",
                required: false,
                description: "Número de agentes a serem retornados. Padrão: 20, Máximo: 50."
              },
              {
                name: "offset",
                type: "integer",
                required: false,
                description: "Número de agentes a pular (para paginação). Padrão: 0."
              },
              {
                name: "function",
                type: "string",
                required: false,
                description: "Filtrar por função do agente."
              }
            ]}
            responses={[
              {
                status: 200,
                description: "Uma lista de agentes foi retornada com sucesso.",
                example: `{
  "data": [
    {
      "id": "agent_123abc",
      "name": "Agente de Suporte",
      "function": "Suporte",
      "description": "Agente para auxiliar em questões de suporte técnico",
      "created_at": "2023-06-10T08:15:00Z",
      "updated_at": "2023-06-12T14:30:00Z"
    },
    {
      "id": "agent_456def",
      "name": "Agente de Vendas",
      "function": "Vendas",
      "description": "Agente para auxiliar no processo de vendas",
      "created_at": "2023-06-05T10:20:00Z",
      "updated_at": "2023-06-11T09:45:00Z"
    }
  ],
  "meta": {
    "total": 8,
    "limit": 20,
    "offset": 0
  }
}`
              }
            ]}
            examples={{
              fetch: `fetch('https://api.zoechat.app/v1/agents?limit=10&function=Suporte', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer sk_live_your_api_key',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));`,
              curl: `curl -X GET \\
  'https://api.zoechat.app/v1/agents?limit=10&function=Suporte' \\
  -H 'Authorization: Bearer sk_live_your_api_key' \\
  -H 'Content-Type: 'application/json'`,
              node: `const axios = require('axios');

axios({
  method: 'get',
  url: 'https://api.zoechat.app/v1/agents',
  headers: {
    'Authorization': 'Bearer sk_live_your_api_key',
    'Content-Type': 'application/json'
  },
  params: {
    limit: 10,
    function: 'Suporte'
  }
})
.then(response => {
  console.log(response.data);
})
.catch(error => {
  console.error(error);
});`
            }}
          />
        </>
      );
    }
    
    // Agent Conversation
    if (activeSection === "agents-agent-conversation") {
      return (
        <>
          <h1 className="text-3xl font-bold mb-6">Conversas com Agente</h1>
          
          <p className="text-gray-700 mb-6">
            Este endpoint permite iniciar ou continuar uma conversa com um agente específico.
          </p>
          
          <Endpoint 
            method="POST"
            path="/agents/{agent_id}/conversation"
            description="Envia uma mensagem para processamento pelo agente."
            parameters={[
              {
                name: "message",
                type: "string",
                required: true,
                description: "O texto da mensagem a ser enviada para o agente."
              },
              {
                name: "conversation_id",
                type: "string",
                required: false,
                description: "ID da conversa existente para continuar. Se omitido, uma nova conversa será criada."
              },
              {
                name: "user_id",
                type: "string",
                required: false,
                description: "ID do usuário que está enviando a mensagem."
              },
              {
                name: "context",
                type: "object",
                required: false,
                description: "Contexto adicional para a conversa."
              }
            ]}
            responses={[
              {
                status: 200,
                description: "A mensagem foi processada com sucesso.",
                example: `{
  "id": "conv_789ghi",
  "agent_id": "agent_123abc",
  "conversation_id": "conv_456def",
  "message": "Olá, preciso de ajuda",
  "response": "Olá! Como posso ajudar você hoje com questões de suporte técnico?",
  "created_at": "2023-06-15T13:25:00Z",
  "context": {
    "user_data": {
      "name": "João Silva",
      "account_type": "Premium"
    }
  },
  "metadata": {
    "intent": "help_request",
    "confidence": 0.95
  }
}`
              }
            ]}
            examples={{
              fetch: `fetch('https://api.zoechat.app/v1/agents/agent_123abc/conversation', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "Olá, preciso de ajuda",
    conversation_id: "conv_456def",
    user_id: "user_789ghi",
    context: {
      user_data: {
        name: "João Silva",
        account_type: "Premium"
      }
    }
  })
})
.then(response => response.json())
.then(data => console.log(data));`,
              curl: `curl -X POST \\
  https://api.zoechat.app/v1/agents/agent_123abc/conversation \\
  -H 'Authorization: Bearer sk_live_your_api_key' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "message": "Olá, preciso de ajuda",
    "conversation_id": "conv_456def",
    "user_id": "user_789ghi",
    "context": {
      "user_data": {
        "name": "João Silva",
        "account_type": "Premium"
      }
    }
  }'`,
              node: `const axios = require('axios');

axios({
  method: 'post',
  url: 'https://api.zoechat.app/v1/agents/agent_123abc/conversation',
  headers: {
    'Authorization': 'Bearer sk_live_your_api_key',
    'Content-Type': 'application/json'
  },
  data: {
    message: "Olá, preciso de ajuda",
    conversation_id: "conv_456def",
    user_id: "user_789ghi",
    context: {
      user_data: {
        name: "João Silva",
        account_type: "Premium"
      }
    }
  }
})
.then(response => {
  console.log(response.data);
})
.catch(error => {
  console.error(error);
});`
            }}
          />
        </>
      );
    }
    
    // If no specific section is matched, show a default message
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">Selecione uma seção</h1>
        <p>
          Por favor, selecione uma seção da documentação no menu lateral para visualizar seu conteúdo.
        </p>
      </div>
    );
  };
  
  return (
    <div className="p-6">
      {renderContent()}
    </div>
  );
};
