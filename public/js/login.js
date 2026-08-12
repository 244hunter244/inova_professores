document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();

  const mensagemDiv = document.getElementById('mensagem');
  mensagemDiv.style.display = 'none';

  const dados = {
    nome_completo: document.getElementById('nome_completo').value,
    senha: document.getElementById('senha').value
  };

  try {
    const resposta = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();

    if (resposta.ok) {
      localStorage.setItem('professorLogado', JSON.stringify(resultado.professor));
      
      mensagemDiv.className = 'mensagem sucesso';
      mensagemDiv.textContent = 'Login realizado! Entrando...';

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    } else {
      mensagemDiv.className = 'mensagem erro';
      mensagemDiv.textContent = resultado.erro || 'Falha ao realizar login.';
    }
  } catch (error) {
    mensagemDiv.className = 'mensagem erro';
    mensagemDiv.textContent = 'Erro ao conectar com o servidor.';
  }
});