
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const APIUsage = () => {
  return (
    <div className="space-y-4 pt-4 border-t mt-4">
      <h4 className="font-medium">Exemplo de uso</h4>
      
      <Tabs defaultValue="fetch" className="w-full">
        <TabsList className="grid grid-cols-3 w-full mb-2">
          <TabsTrigger value="fetch">Fetch</TabsTrigger>
          <TabsTrigger value="curl">cURL</TabsTrigger>
          <TabsTrigger value="node">Node.js</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fetch" className="mt-0">
          <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
            <pre>
{`fetch('https://api.viainfra.com/v1/contacts', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer sk_live_your_api_key',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));`}
            </pre>
          </div>
        </TabsContent>
        
        <TabsContent value="curl" className="mt-0">
          <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
            <pre>
{`curl -X GET \\
  https://api.viainfra.com/v1/contacts \\
  -H 'Authorization: Bearer sk_live_your_api_key' \\
  -H 'Content-Type: application/json'`}
            </pre>
          </div>
        </TabsContent>
        
        <TabsContent value="node" className="mt-0">
          <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
            <pre>
{`const axios = require('axios');

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
            </pre>
          </div>
        </TabsContent>
      </Tabs>

      <h4 className="font-medium pt-2">Integrando com agentes</h4>
      <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
        <pre>
{`// Acessando a base de conhecimento de um agente
fetch('https://api.viainfra.com/v1/agents/agent123/knowledge', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer sk_live_your_api_key',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));

// Enviando uma mensagem para processamento pelo agente
fetch('https://api.viainfra.com/v1/agents/agent123/conversation', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "Olá, preciso de ajuda",
    conversation_id: "conv123",
    user_id: "user456"
  })
})
.then(response => response.json())
.then(data => console.log(data));`}
        </pre>
      </div>
    </div>
  );
};
