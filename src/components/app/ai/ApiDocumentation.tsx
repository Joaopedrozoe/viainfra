
export const ApiDocumentation = () => {
  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold mb-4">Documentação da API</h2>
      <div className="prose max-w-none">
        <p className="text-gray-700">
          Para integrar seu serviço de IA com o ZOE Chat, siga estas diretrizes:
        </p>
        
        <h3 className="text-lg font-semibold mt-6">Requisição</h3>
        <p className="text-gray-700">
          Seu webhook receberá requisições POST com o seguinte formato:
        </p>
        <div className="bg-gray-50 p-4 rounded-md border mt-2 overflow-x-auto">
          <pre className="text-sm">
{`{
  "message": "Mensagem enviada pelo usuário",
  "conversationId": "id-da-conversa",
  "sender": {
    "id": "id-do-remetente",
    "name": "Nome do Cliente",
    "channel": "whatsapp"
  },
  "timestamp": "2023-06-15T10:30:00Z"
}`}
          </pre>
        </div>
        
        <h3 className="text-lg font-semibold mt-6">Resposta</h3>
        <p className="text-gray-700">
          Sua API deve responder com um JSON no seguinte formato:
        </p>
        <div className="bg-gray-50 p-4 rounded-md border mt-2 overflow-x-auto">
          <pre className="text-sm">
{`{
  "reply": "Resposta da IA para o usuário",
  "action": "send_message",
  "metadata": {
    // Dados adicionais (opcional)
  }
}`}
          </pre>
        </div>
        
        <h3 className="text-lg font-semibold mt-6">Ações Possíveis</h3>
        <ul className="list-disc pl-5 text-gray-700">
          <li><strong>send_message</strong>: Envia uma mensagem de texto</li>
          <li><strong>send_image</strong>: Envia uma imagem (URL na propriedade "media")</li>
          <li><strong>send_file</strong>: Envia um arquivo (URL na propriedade "media")</li>
          <li><strong>tag_conversation</strong>: Adiciona uma tag à conversa</li>
          <li><strong>assign_agent</strong>: Transfere a conversa para um agente humano</li>
        </ul>
      </div>
    </div>
  );
};
