-- LGPD Compliance Documentation
COMMENT ON TABLE profiles IS 'Dados pessoais - LGPD Art. 5º - requer consentimento e direito ao esquecimento';
COMMENT ON TABLE contacts IS 'Dados de contatos - LGPD Art. 7º - base legal: legítimo interesse para atendimento';
COMMENT ON TABLE conversations IS 'Histórico de atendimento - LGPD Art. 16º - dados devem ser precisos e atualizados';
COMMENT ON TABLE messages IS 'Conteúdo de mensagens - LGPD Art. 18º - direito de acesso e portabilidade';
COMMENT ON COLUMN profiles.email IS 'Dado pessoal sensível - LGPD';
COMMENT ON COLUMN profiles.phone IS 'Dado pessoal sensível - LGPD';
COMMENT ON COLUMN contacts.email IS 'Dado pessoal - LGPD';
COMMENT ON COLUMN contacts.phone IS 'Dado pessoal - LGPD';