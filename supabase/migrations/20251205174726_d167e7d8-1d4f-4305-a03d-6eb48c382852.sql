-- Desconectar todas as instâncias que não são TESTE2
UPDATE whatsapp_instances 
SET connection_state = 'close', status = 'disconnected'
WHERE instance_name != 'TESTE2';