document.addEventListener('DOMContentLoaded', () => {
  const formCadastro = document.getElementById('formCadastro');
  const mensagemDiv = document.getElementById('mensagem');

  if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nome_completo = document.getElementById('nome_completo').value.trim();
      const materia = document.getElementById('materia').value.trim();
      const idade = document.getElementById('idade').value.trim();
      const rg = document.getElementById('rg').value.trim();
      const senha = document.getElementById('senha').value.trim();

      const payload = {
        nome_completo,
        materia,
        idade,
        rg,
        senha
      };

      try {
        // Alterado de 'http://localhost:3000/cadastrar' para '/cadastrar'
        const response = await fetch('/cadastrar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
          mensagemDiv.className = 'mensagem sucesso';
          mensagemDiv.textContent = 'Cadastro realizado com sucesso! Redirecionando...';
          
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 2000);
        } else {
          mensagemDiv.className = 'mensagem erro';
          mensagemDiv.textContent = data.error || 'Erro ao realizar cadastro.';
        }
      } catch (err) {
        console.error('Erro na requisição de cadastro:', err);
        mensagemDiv.className = 'mensagem erro';
        mensagemDiv.textContent = 'Falha ao conectar com o servidor.';
      }
    });
  }
});