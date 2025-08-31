import { usePreviewConversation } from "@/contexts/PreviewConversationContext";

export const DebugConversations = () => {
  const { previewConversations } = usePreviewConversation();

  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 p-4 rounded max-w-sm z-50 text-xs">
      <h4 className="font-bold text-red-800">🐛 DEBUG PREVIEW</h4>
      <p><strong>Total:</strong> {previewConversations.length}</p>
      
      {previewConversations.length === 0 ? (
        <p className="text-red-600">❌ Nenhuma conversa de preview encontrada</p>
      ) : (
        <div className="max-h-32 overflow-y-auto">
          {previewConversations.map((conv, idx) => (
            <div key={conv.id} className="border-b border-red-200 py-1">
              <p className="font-medium">#{idx + 1}: {conv.name}</p>
              <p className="text-gray-600">{conv.preview}</p>
              <p className="text-gray-500">ID: {conv.id}</p>
              <p className="text-purple-600">is_preview: {conv.is_preview ? '✅' : '❌'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};