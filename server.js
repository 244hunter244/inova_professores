const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Servir os arquivos da pasta public usando o caminho absoluto do servidor
app.use(express.static(path.join(__dirname, 'public')));

// Credenciais do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wsfbsjddjpmcomlqhepr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_TlOrAEtgQqn8HDWf88mkAA_TAmqNmtR';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// -------------------------------------------------------------
// ROTA 1: CADASTRO DE PROFESSOR
// -------------------------------------------------------------
app.post('/cadastrar', async (req, res) => {
  const { nome_completo, materia, idade, rg, senha } = req.body;

  if (!nome_completo || !materia || !idade || !rg || !senha) {
    return res.status(400).json({ 
      erro: 'Validação', 
      detalhe: 'Preencha todos os campos do formulário!' 
    });
  }

  try {
    // Criptografa a senha antes de enviar ao banco
    const senhaHash = await bcrypt.hash(senha, 10);

    // Insere no Supabase
    const { data, error } = await supabase
      .from('professores')
      .insert([{ 
        nome_completo, 
        materia, 
        idade: parseInt(idade), 
        rg, 
        senha: senhaHash 
      }])
      .select();

    if (error) {
      throw error;
    }

    return res.status(201).json({ 
      mensagem: 'Professor cadastrado com sucesso!', 
      professor: data[0] 
    });

  } catch (error) {
    console.error('--- ERRO DETALHADO NO SUPABASE ---', error);

    let mensagemEspecifica = error.message || 'Erro desconhecido no banco de dados';

    if (error.code === '42703') {
      mensagemEspecifica = 'A coluna "senha" não existe na sua tabela do Supabase.';
    } else if (error.code === '23505') {
      mensagemEspecifica = 'Este professor ou RG já está cadastrado no sistema.';
    } else if (error.code === '22P02') {
      mensagemEspecifica = 'O campo Idade deve conter apenas números inteiros válidos.';
    }

    return res.status(500).json({ 
      erro: 'Falha no cadastro', 
      detalhe: mensagemEspecifica 
    });
  }
});

// -------------------------------------------------------------
// ROTA 2: LOGIN DE PROFESSOR (Nome Completo + Senha)
// -------------------------------------------------------------
app.post('/login', async (req, res) => {
  const { nome_completo, senha } = req.body;

  if (!nome_completo || !senha) {
    return res.status(400).json({ erro: 'Nome completo e senha são obrigatórios!' });
  }

  try {
    // Busca o professor pelo Nome Completo
    const { data: professores, error } = await supabase
      .from('professores')
      .select('*')
      .eq('nome_completo', nome_completo);

    if (error || !professores || professores.length === 0) {
      return res.status(401).json({ erro: 'Professor não encontrado!' });
    }

    const professor = professores[0];

    // Compara a senha informada com a senha criptografada no banco
    const senhaValida = await bcrypt.compare(senha, professor.senha);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'Senha incorreta!' });
    }

    // Remove a hash da senha antes de retornar os dados
    delete professor.senha;

    return res.status(200).json({ 
      mensagem: 'Login realizado com sucesso!', 
      professor 
    });

  } catch (error) {
    console.error('--- ERRO NO LOGIN ---', error);

    return res.status(500).json({ 
      erro: 'Erro ao realizar login', 
      detalhe: error.message || error 
    });
  }
});

// -------------------------------------------------------------
// ROTA 3: LISTAR HORÁRIOS DOS LABORATÓRIOS
// -------------------------------------------------------------
app.get('/horarios', async (req, res) => {
  try {
    // AQUI ESTÁ A MUDANÇA: 'horarios_laboratorio' em vez de 'horarios'
    const { data, error } = await supabase
      .from('horarios_laboratorio')
      .select('*');

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('--- ERRO AO BUSCAR HORÁRIOS ---', error);

    return res.status(500).json({ 
      erro: 'Erro ao carregar os horários do banco de dados.',
      detalhe: error.message || error
    });
  }
});
// -------------------------------------------------------------
// ROTAS DE AVISOS E RECADOS
// -------------------------------------------------------------
app.get('/avisos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('avisos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar avisos' });
  }
});

app.post('/avisos', async (req, res) => {
  const { professor_nome, mensagem, tipo } = req.body;
  try {
    const { data, error } = await supabase
      .from('avisos')
      .insert([{ professor_nome, mensagem, tipo: tipo || 'geral' }])
      .select();

    if (error) throw error;
    return res.status(201).json(data[0]);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao publicar aviso' });
  }
});

// -------------------------------------------------------------
// ROTAS DE AGENDAMENTO E CANCELAMENTO DE HORÁRIOS
// -------------------------------------------------------------

// Reservar / Criar Horário
app.post('/horarios/reservar', async (req, res) => {
  const { dia_semana, horario, laboratorio, professor, materia, turma } = req.body;

  try {
    const { data, error } = await supabase
      .from('horarios_laboratorio')
      .insert([{ dia_semana, horario, laboratorio, professor, materia, turma }])
      .select();

    if (error) throw error;
    return res.status(201).json(data[0]);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao reservar horário' });
  }
});

// Cancelar / Deletar Horário do Banco
app.delete('/horarios/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('horarios_laboratorio')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return res.status(200).json({ mensagem: 'Horário cancelado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao cancelar horário' });
  }
});
// Excluir um aviso do mural pelo ID
app.delete('/avisos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('avisos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return res.status(200).json({ mensagem: 'Aviso excluído com sucesso!' });
  } catch (error) {
    console.error('Erro ao excluir aviso:', error);
    return res.status(500).json({ erro: 'Erro ao excluir aviso do banco' });
  }
});

// -------------------------------------------------------------
// INICIALIZAÇÃO DO SERVIDOR
// -------------------------------------------------------------
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.path === '/' ? 'login.html' : req.path));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;