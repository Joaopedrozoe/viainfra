-- Remover instâncias antigas/inativas que não são mais utilizadas
-- Mantendo apenas VIAINFRAOFICIAL que é a instância ativa

DELETE FROM whatsapp_instances 
WHERE instance_name IN ('VIAINFRA', 'VIAINFRA2', 'TESTE', 'teste', 'TESTE2', 'TESTE CONEXÃO AUTONOMA', 'TINFO', 'TINFO - 35', 'JUNIORCORRETOR', 'OFICIAL', 'Via Infra ')
AND instance_name != 'VIAINFRAOFICIAL';