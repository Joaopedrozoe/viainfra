
import { Message } from "./types";

export const mockMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "1",
      content: "Olá, preciso de ajuda com meu pedido #12345",
      sender: "user",
      timestamp: "09:45"
    },
    {
      id: "2",
      content: "Olá João! Claro, vou verificar seu pedido. Um momento, por favor.",
      sender: "agent",
      timestamp: "09:47"
    },
    {
      id: "3",
      content: "Obrigado por aguardar. Seu pedido foi enviado ontem e deve chegar em 2 dias úteis.",
      sender: "agent",
      timestamp: "09:49"
    },
    {
      id: "4",
      content: "Perfeito! Vou aguardar então. Muito obrigado pela ajuda!",
      sender: "user",
      timestamp: "09:51"
    }
  ],
  "2": [
    {
      id: "1",
      content: "Qual o horário de funcionamento?",
      sender: "user",
      timestamp: "Ontem"
    },
    {
      id: "2",
      content: "Olá Maria! Nosso horário de funcionamento é de segunda a sexta, das 9h às 18h e aos sábados das 9h às 13h.",
      sender: "agent",
      timestamp: "Ontem"
    }
  ],
  "3": [
    {
      id: "1",
      content: "Vocês têm esse produto em estoque?",
      sender: "user",
      timestamp: "Seg"
    }
  ],
  "4": [
    {
      id: "1",
      content: "Obrigada pelo atendimento!",
      sender: "user",
      timestamp: "Dom"
    },
    {
      id: "2",
      content: "É um prazer atendê-la, Ana! Estamos à disposição sempre que precisar.",
      sender: "agent",
      timestamp: "Dom"
    }
  ],
  "5": [
    {
      id: "1",
      content: "Quando meu pedido será entregue?",
      sender: "user",
      timestamp: "Sex"
    },
    {
      id: "2",
      content: "Olá Carlos! Vou verificar o status do seu pedido agora mesmo.",
      sender: "agent",
      timestamp: "Sex"
    }
  ]
};
