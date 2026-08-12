document.getElementById('formCadastro').addEventListener('submit', async (e) => {
  e.preventDefault();

  const mensagemDiv = document.getElementById('mensagem');
  mensagemDiv.style.display = 'none';
  
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
      mensagemDiv.textContent = 'Professor cadastrado com sucesso! Redirecionando...';
      document.getElementById('formCadastro').reset();

      // Aguarda 2 segundos e redireciona para a página de login
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else {
      mensagemDiv.className = 'mensagem erro';
      const detalheErro = resultado.detalhe ? `: ${resultado.detalhe}` : '';
      mensagemDiv.textContent = `${resultado.erro}${detalheErro}`;
    }
  } catch (error) {
    mensagemDiv.className = 'mensagem erro';
    mensagemDiv.textContent = 'Erro ao conectar com o servidor Node.js.';
  }
});