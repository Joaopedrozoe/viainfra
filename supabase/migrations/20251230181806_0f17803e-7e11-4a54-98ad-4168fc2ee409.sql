
-- Atualizar a foto do grupo VIAINFRA-O.M MANUTENÇÃO
-- A URL do WhatsApp já está configurada, mas vamos garantir que está atualizada
UPDATE contacts
SET 
  avatar_url = 'https://pps.whatsapp.net/v/t61.24694-24/506907792_1247235593546751_1131351311057526842_n.jpg?ccb=11-4&oh=01_Q5Aa3QHi8D54DK6c_BZeF9VGVz7oc0oLsvGThOoYrH2qE0uL7w&oe=695111DD&_nc_sid=5e03e0&_nc_cat=101',
  updated_at = NOW()
WHERE metadata->>'remoteJid' = '120363419406852083@g.us';
