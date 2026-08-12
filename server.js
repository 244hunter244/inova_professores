const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Configure aqui com as credenciais do seu Supabase
const SUPABASE_URL = 'https://wsfbsjddjpmcomlqhepr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TlOrAEtgQqn8HDWf88mkAA_TAmqNmtR';

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

    // Mapeamento de erros comuns
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
// INICIALIZAÇÃO DO SERVIDOR
// -------------------------------------------------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});