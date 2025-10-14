-- Tornar o campo agendamento nullable na tabela chamados
ALTER TABLE chamados 
ALTER COLUMN agendamento DROP NOT NULL;