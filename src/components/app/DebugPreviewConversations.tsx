import { usePreviewConversation } from "@/contexts/PreviewConversationContext";

export const DebugPreviewConversations = () => {
  const { previewConversations } = usePreviewConversation();

  return (
    <div className="fixed top-4 right-4 bg-red-100 p-4 rounded max-w-md z-50">
      <h3 className="font-bold">DEBUG: Preview Conversations</h3>
      <p>Count: {previewConversations.length}</p>
      {previewConversations.map(conv => (
        <div key={conv.id} className="border-b py-1">
          <p className="text-xs">{conv.name}</p>
          <p className="text-xs text-gray-600">{conv.preview}</p>
        </div>
      ))}
    </div>
  );
};