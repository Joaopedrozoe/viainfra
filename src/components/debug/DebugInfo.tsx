import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth";

export const DebugInfo = () => {
  const { profile } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  
  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setShowDebug(true)}
          className="bg-blue-500 text-white px-3 py-1 rounded text-xs"
        >
          Debug
        </button>
      </div>
    );
  }

  const isAdmin = profile?.email === "elisabete.silva@viainfra.com.br";

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Debug Info</CardTitle>
            <button
              onClick={() => setShowDebug(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <div>
            <strong>Email:</strong> {profile?.email || "No email"}
          </div>
          <div>
            <strong>Name:</strong> {profile?.name || "No name"}
          </div>
          <div>
            <strong>Is Admin:</strong> 
            <Badge variant={isAdmin ? "default" : "secondary"} className="ml-2">
              {isAdmin ? "YES" : "NO"}
            </Badge>
          </div>
          <div>
            <strong>Expected Admin Email:</strong> elisabete.silva@viainfra.com.br
          </div>
          <div>
            <strong>Match:</strong> {profile?.email === "elisabete.silva@viainfra.com.br" ? "✅" : "❌"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};