-- Dados de exemplo para desenvolvimento/demonstração do catálogo.
-- Corre manualmente no SQL Editor do Supabase (não faz parte das
-- migrações versionadas — não corre automaticamente em produção).

insert into public.toners
  (marca, modelo, referencia, compatibilidade, quantidade, quantidade_reservada, estado, localizacao, categoria, observacoes)
values
  ('HP', 'LaserJet 05A', 'CE505A', array['HP LaserJet P2035', 'HP LaserJet P2055'], 12, 0, 'novo', 'Armazém Lisboa', 'Toner Laser', 'Caixas seladas, nunca abertas.'),
  ('HP', 'LaserJet 85A', 'CE285A', array['HP LaserJet P1102', 'HP LaserJet M1212nf'], 4, 0, 'usado', 'Armazém Lisboa', 'Toner Laser', 'Nível estimado acima de 60%.'),
  ('Canon', '728', '728', array['Canon MF4410', 'Canon MF4430'], 8, 0, 'novo', 'Armazém Porto', 'Toner Laser', null),
  ('Canon', '731', '731', array['Canon LBP7100Cn'], 3, 0, 'reconstruido', 'Armazém Porto', 'Toner Laser', 'Reconstruído por fornecedor certificado.'),
  ('Brother', 'TN-2220', 'TN2220', array['Brother HL-2240', 'Brother DCP-7060D'], 6, 0, 'novo', 'Armazém Lisboa', 'Toner Laser', null),
  ('Epson', 'C13S050473', 'C13S050473', array['Epson AcuLaser C1700'], 2, 0, 'usado', 'Armazém Coimbra', 'Toner Laser', 'Cartucho com algum uso, funcional.'),
  ('Samsung', 'MLT-D111S', 'MLT-D111S', array['Samsung Xpress M2020', 'Samsung Xpress M2070'], 10, 0, 'novo', 'Armazém Lisboa', 'Toner Laser', null),
  ('Xerox', '106R02773', '106R02773', array['Xerox Phaser 3020', 'Xerox WorkCentre 3025'], 5, 0, 'novo', 'Armazém Porto', 'Toner Laser', null);
