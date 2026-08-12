document.addEventListener('DOMContentLoaded', () => {
  // Recupera os dados do professor salvos no localStorage no momento do login
  const professorSalvo = localStorage.getItem('professorLogado');

  // Se não estiver logado, volta para a página de login
  if (!professorSalvo) {
    window.location.href = 'login.html';
    return;
  }

  const professor = JSON.parse(professorSalvo);

  // Exibe o nome do professor na barra superior
  const elementoNome = document.getElementById('nomeProfessor');
  if (elementoNome) {
    elementoNome.textContent = professor.nome_completo;
  }

  // Função para fazer Logout (Sair da conta)
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('professorLogado');
      window.location.href = 'login.html';
    });
  }
});
