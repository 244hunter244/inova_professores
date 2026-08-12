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

// --- ROTA DE CADASTRO DE PROFESSOR ---
app.post('/cadastrar', async (req, res) => {
  const { nome_completo, materia, idade, rg, senha } = req.body;

  // Validação simples dos campos
  if (!nome_completo || !materia || !idade || !rg || !senha) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios!' });
  }

  try {
    // Criptografa a senha antes de salvar
    const senhaHash = await bcrypt.hash(senha, 10);

    // Insere no banco de dados Supabase
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

    if (error) throw error;

    return res.status(201).json({ mensagem: 'Professor cadastrado com sucesso!', professor: data[0] });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao cadastrar professor', detalhe: error.message });
  }
});

// --- ROTA DE LOGIN DE PROFESSOR ---
app.post('/login', async (req, res) => {
  const { rg, senha } = req.body;

  if (!rg || !senha) {
    return res.status(400).json({ erro: 'RG e senha são obrigatórios!' });
  }

  try {
    // Busca o professor pelo RG
    const { data: professores, error } = await supabase
      .from('professores')
      .select('*')
      .eq('rg', rg);

    if (error || professores.length === 0) {
      return res.status(401).json({ erro: 'Professor não encontrado!' });
    }

    const professor = professores[0];

    // Compara a senha informada com a senha criptografada no banco
    const senhaValida = await bcrypt.compare(senha, professor.senha);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'Senha incorreta!' });
    }

    // Login bem-sucedido (não enviamos a hash da senha de volta)
    delete professor.senha;
    return res.status(200).json({ mensagem: 'Login realizado com sucesso!', professor });

  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao realizar login', detalhe: error.message });
  }
});

// Inicia o servidor na porta 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});