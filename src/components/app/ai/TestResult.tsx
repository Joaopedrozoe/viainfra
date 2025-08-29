
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type TestResultProps = {
  result: {
    success: boolean;
    message: string;
    response?: string;
    requestTime?: string;
  };
};

export const TestResult = ({ result }: TestResultProps) => {
  if (!result) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultado do Teste</CardTitle>
        <div className="flex items-center">
          <div className={`h-3 w-3 rounded-full mr-2 ${result.success ? "bg-green-500" : "bg-red-500"}`}></div>
          <span className={result.success ? "text-green-600" : "text-red-600"}>
            {result.message}
          </span>
          {result.requestTime && (
            <span className="ml-2 text-gray-500 text-sm">
              ({result.requestTime})
            </span>
          )}
        </div>
      </CardHeader>
      {result.response && (
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Resposta
            </label>
            <div className="bg-gray-50 p-4 rounded-md border">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                {result.response}
              </pre>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
