
-- Limpar conversa e contato inválido (phone @lid)
DELETE FROM conversations WHERE contact_id = 'a5057eb7-b923-4b08-9804-0abc72d0791d';
DELETE FROM contacts WHERE id = 'a5057eb7-b923-4b08-9804-0abc72d0791d';

-- Limpar duplicatas de Adao (manter o que tem avatar)
DELETE FROM conversations WHERE contact_id = '2b86924b-41c6-4558-ae83-a5fe0f9007df';
DELETE FROM contacts WHERE id = '2b86924b-41c6-4558-ae83-a5fe0f9007df';
