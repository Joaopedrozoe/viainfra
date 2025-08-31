import { usePreviewConversation } from "@/contexts/PreviewConversationContext";
import { useEffect } from "react";

export const DebugConversations = () => {
  const context = usePreviewConversation();
  
  if (!context) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded z-50 text-xs">
        ❌ CONTEXTO NÃO ENCONTRADO
      </div>
    );
  }
  
  const { previewConversations } = context;

  useEffect(() => {
    console.log('🚨 DEBUG COMPONENT: previewConversations changed:', previewConversations.length);
    console.log('🚨 DEBUG COMPONENT: context exists:', !!context);
  }, [previewConversations, context]);

  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 p-4 rounded max-w-sm z-50 text-xs">
      <h4 className="font-bold text-red-800">🐛 DEBUG PREVIEW</h4>
      <p><strong>Total:</strong> {previewConversations.length}</p>
      <p><strong>Context working:</strong> {usePreviewConversation ? '✅' : '❌'}</p>
      
      {previewConversations.length === 0 ? (
        <p className="text-red-600">❌ Nenhuma conversa de preview encontrada</p>
      ) : (
        <div className="max-h-32 overflow-y-auto">
          {previewConversations.map((conv, idx) => (
            <div key={conv.id} className="border-b border-red-200 py-1">
              <p className="font-medium">#{idx + 1}: {conv.name}</p>
              <p className="text-gray-600">{conv.preview}</p>
              <p className="text-gray-500">ID: {conv.id.slice(-8)}</p>
              <p className="text-purple-600">is_preview: {conv.is_preview ? '✅' : '❌'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};