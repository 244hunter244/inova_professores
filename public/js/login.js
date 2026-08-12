document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('formLogin'); // ID do formulário
  const msgErro = document.getElementById('msgErro');     // Elemento para exibir o erro

  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Limpa mensagem anterior
      if (msgErro) msgErro.textContent = '';

      const nome_completo = document.getElementById('nomeCompleto').value.trim();
      const senha = document.getElementById('senha').value.trim();

      if (!nome_completo || !senha) {
        exibirMensagem('Preencha todos os campos!');
        return;
      }

      try {
        // Usamos rota relativa para funcionar localmente e na Vercel
        const res = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome_completo, senha })
        });

        const dados = await res.json();

        if (!res.ok) {
          // Exibe o erro retornado pelo backend (ex: "Senha incorreta!" ou "Professor não encontrado!")
          exibirMensagem(dados.erro || dados.detalhe || 'Erro ao realizar login.');
          return;
        }

        // Se o login deu certo, salva os dados e redireciona
        localStorage.setItem('professorLogado', JSON.stringify(dados.professor));
        window.location.href = 'dashboard.html';

      } catch (err) {
        console.error('Erro de conexão:', err);
        // Exibe erro de conexão quando o backend não responde
        exibirMensagem('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      }
    });
  }

  function exibirMensagem(texto) {
    if (msgErro) {
      msgErro.textContent = texto;
      msgErro.style.display = 'block';
    } else {
      alert(texto);
    }
  }
});