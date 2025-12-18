-- Fix incorrect contact name
UPDATE contacts 
SET name = 'Contato 5511971947986'
WHERE phone = '5511971947986' 
AND name = 'Jairo Encarregado Empresa'