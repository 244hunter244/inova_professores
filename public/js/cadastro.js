document.getElementById('formCadastro').addEventListener('submit', async (e) => {
  e.preventDefault();

  const mensagemDiv = document.getElementById('mensagem');
  
  // Coleta os dados do formulário
  const dados = {
    nome_completo: document.getElementById('nome_completo').value,
    materia: document.getElementById('materia').value,
    idade: document.getElementById('idade').value,
    rg: document.getElementById('rg').value,
    senha: document.getElementById('senha').value
  };

  try {
    const resposta = await fetch('http://localhost:3000/cadastrar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();

    if (resposta.ok) {
      mensagemDiv.className = 'mensagem sucesso';
      mensagemDiv.textContent = 'Professor cadastrado com sucesso!';
      document.getElementById('formCadastro').reset();
    } else {
      mensagemDiv.className = 'mensagem erro';
      mensagemDiv.textContent = resultado.erro || 'Erro ao realizar cadastro.';
    }
  } catch (error) {
    mensagemDiv.className = 'mensagem erro';
    mensagemDiv.textContent = 'Erro ao conectar com o servidor.';
  }
});