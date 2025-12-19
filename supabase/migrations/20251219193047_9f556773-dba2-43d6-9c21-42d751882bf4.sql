-- Atualizar foto de perfil do Via Logistic
UPDATE contacts 
SET avatar_url = 'https://pps.whatsapp.net/v/t61.24694-24/505476567_713874908169627_539794493345961395_n.jpg?ccb=11-4&oh=01_Q5Aa3QH8CFSpiR8lA8Jp6YZgy22KIXcvRPqxc9LweXKudx-K6w&oe=69529C6B&_nc_sid=5e03e0&_nc_cat=110'
WHERE id = '37c3e917-d9f3-416d-8a75-0fc2b52bec19';

-- Mover mensagem do contato duplicado para a conversa principal
UPDATE messages 
SET conversation_id = 'b64bfff8-7ac1-4845-a1ed-c230c9f23d9a'
WHERE conversation_id = '86fcf7ac-d7f3-4936-b172-4aa19dd6a5b0';

-- Deletar conversa duplicada
DELETE FROM conversations WHERE id = '86fcf7ac-d7f3-4936-b172-4aa19dd6a5b0';

-- Deletar contato duplicado sem telefone
DELETE FROM contacts WHERE id = 'e1ae50fc-4e9d-448f-832e-af5ab27f5985';