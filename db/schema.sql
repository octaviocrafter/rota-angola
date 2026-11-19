-- ROTA: base preparada para Firebase/SQL equivalente. Nunca guardar palavra-passe em texto simples.
CREATE TABLE utilizadores (id TEXT PRIMARY KEY, nome TEXT NOT NULL, telefone TEXT UNIQUE NOT NULL, tipo TEXT NOT NULL CHECK(tipo IN ('passageiro','motorista_autocarro','transporte_privado','administrador')), foto_url TEXT, estado TEXT DEFAULT 'pendente');
CREATE TABLE passageiros (utilizador_id TEXT PRIMARY KEY, familiar_nome TEXT, familiar_telefone TEXT);
CREATE TABLE motoristas (utilizador_id TEXT PRIMARY KEY, carta_url TEXT, bi_frente_url TEXT, bi_verso_url TEXT, matricula TEXT NOT NULL, veiculo_foto_url TEXT, veiculo_cor TEXT, veiculo_marca TEXT, rota TEXT, linha TEXT, gps_activo BOOLEAN DEFAULT FALSE, verificado BOOLEAN DEFAULT FALSE);
CREATE TABLE viagens (id TEXT PRIMARY KEY, passageiro_id TEXT, motorista_id TEXT, destino TEXT, inicio TEXT, fim TEXT, partilha_activa BOOLEAN DEFAULT FALSE, estado TEXT DEFAULT 'activa');
CREATE TABLE denuncias (id TEXT PRIMARY KEY, viagem_id TEXT, motivo TEXT NOT NULL, comentario TEXT, estado TEXT DEFAULT 'pendente', conclusao TEXT);
CREATE TABLE avaliacoes (id TEXT PRIMARY KEY, viagem_id TEXT, estrelas INTEGER CHECK(estrelas BETWEEN 1 AND 5), comentario TEXT);
-- principal=true: único administrador que pode criar, remover ou suspender outros administradores.
-- principal=false: pode aprovar/rejeitar transportes, tratar denúncias e suspender motoristas.
CREATE TABLE administradores (utilizador_id TEXT PRIMARY KEY, principal BOOLEAN DEFAULT FALSE, activo BOOLEAN DEFAULT TRUE, criado_por TEXT, suspenso_em TEXT);
