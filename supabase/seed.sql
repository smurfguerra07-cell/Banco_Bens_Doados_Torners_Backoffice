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
  ('Xerox', '106R02773', '106R02773', array['Xerox Phaser 3020', 'Xerox WorkCentre 3025'], 5, 0, 'novo', 'Armazém Porto', 'Toner Laser', null)
on conflict (referencia) do nothing;

-- Fotografias reais de tinteiros/toners (Wikimedia Commons, licença livre).
-- Créditos obrigatórios (CC BY-SA):
--   HP 117A, Xerox Phaser 6600, Kyocera TK-550 — © Raimond Spekking / CC BY-SA 4.0
--   Samsung (front/side view) — © W.carter / CC BY-SA 4.0
--   Toner Cartridge (genérico) — CC BY-SA 4.0
--   Brother TN — © OnlineXpress / CC BY-SA 3.0
--   Tonerkassette HP — domínio público
-- Substituir por fotografias reais dos vossos toners quando o upload para o
-- Storage estiver disponível na gestão de toners do BackOffice.
insert into public.toner_imagens (toner_id, storage_path, ordem)
select t.id, v.url, 0
from public.toners t
join (values
  ('CE505A', 'https://upload.wikimedia.org/wikipedia/commons/0/00/HP_117A_-_black_laser_toner_cartridge-2407.jpg'),
  ('CE285A', 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Tonerkassette_Laserdrucker_HP.jpg'),
  ('728', 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Toner_Cartridge.jpg'),
  ('731', 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Kyocera_FS-C5200DN_-_Toner_cartridges_TK-550_in_black%2C_yellow%2C_cyan%2C_and_magenta-3574.jpg'),
  ('TN2220', 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Toner-laser-grande-capacite-noir-brother-capacite-2600-pages.jpg'),
  ('C13S050473', 'https://upload.wikimedia.org/wikipedia/commons/3/37/Samsung_laser_toner_cartridge_side_view.jpg'),
  ('MLT-D111S', 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Samsung_laser_toner_cartridge_front_view.jpg'),
  ('106R02773', 'https://upload.wikimedia.org/wikipedia/commons/5/50/Xerox_Phaser_6600_toner_cartridge_in_magenta-7639.jpg')
) as v(referencia, url) on v.referencia = t.referencia
where not exists (
  select 1 from public.toner_imagens where toner_id = t.id
);
