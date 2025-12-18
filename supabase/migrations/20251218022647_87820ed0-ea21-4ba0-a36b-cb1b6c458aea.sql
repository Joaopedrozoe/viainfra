-- Deletar conversas vazias com números de telefone inválidos (IDs internos do WhatsApp)
DELETE FROM conversations 
WHERE id IN (
  'd65e2d47-e148-4a22-871c-d7fb68f72918',
  'c647a0b1-d588-4f37-9928-152ecd3b956b',
  '249d3833-eecb-45cc-8e3c-d78f6e2706d0',
  '4db90552-a32f-4b18-a13d-0f4887ce67ca',
  'acf4432c-d1ef-4e50-abdc-1197f20b2303',
  'f84a8dfd-a20b-4c16-bec6-37a957097e07',
  '46eb1502-7079-4784-ac43-72a8f4e86b88',
  'ef7410a1-eeaf-492a-bc85-6980d29c548c',
  '0fe96786-b7a4-4600-bc2e-9fe66f80abaf',
  '762bc46e-3450-4431-b5b3-843005c2f535'
);

-- Deletar contatos com números inválidos (IDs internos)
DELETE FROM contacts 
WHERE company_id = 'da17735c-5a76-4797-b338-f6e63a7b3f8b'
AND phone IN (
  '122007689646323',
  '37765664264440',
  '37486625607885',
  '272812094804137',
  '79672213794847',
  '66022354743472',
  '133728789614670',
  '195811971432655',
  '191851994869852',
  '200579720728694'
);