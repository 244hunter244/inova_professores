document.addEventListener('DOMContentLoaded', async () => {
  const professorSalvo = localStorage.getItem('professorLogado');
  if (!professorSalvo) {
    window.location.href = 'login.html';
    return;
  }

  const professor = JSON.parse(professorSalvo);
  document.getElementById('nomeProfessor').textContent = professor.nome_completo;

  document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.removeItem('professorLogado');
    window.location.href = 'login.html';
  });

  const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  const blocosHorario = ['06:50', '07:40', '08:30', '09:30', '10:20', '11:10'];
  const laboratoriosDisponiveis = ['Laboratório 01', 'Laboratório 02', 'Laboratório 03'];

  // --- CARREGAR HORÁRIOS ---
  async function carregarGrade() {
    try {
      const res = await fetch('http://localhost:3000/horarios');
      const dadosHorarios = await res.json();
      montarGrade(dadosHorarios);
    } catch (err) {
      console.error('Erro ao carregar grade:', err);
    }
  }

  function montarGrade(dados) {
    const corpoTabela = document.getElementById('corpoTabela');
    corpoTabela.innerHTML = '';

    dias.forEach(dia => {
      const tr = document.createElement('tr');

      const tdDia = document.createElement('td');
      tdDia.className = 'col-dia';
      tdDia.textContent = dia;
      tr.appendChild(tdDia);

      blocosHorario.forEach(horario => {
        const tdHorario = document.createElement('td');
        tdHorario.className = 'celula-horario';

        let totalOcupados = 0;

        laboratoriosDisponiveis.forEach(lab => {
          const item = dados.find(
            h => h.dia_semana === dia && h.horario === horario && h.laboratorio === lab
          );

          const card = document.createElement('div');

          if (item) {
            totalOcupados++;
            let labClass = lab === 'Laboratório 02' ? 'lab-02' : lab === 'Laboratório 03' ? 'lab-03' : 'lab-01';
            const ehMeuHorario = item.professor === professor.nome_completo;

            card.className = `card-agendamento ${ehMeuHorario ? 'meu-card' : 'outro-card'}`;
            card.innerHTML = `
              <span class="prof-nome">${item.professor}</span>
              <span class="turma-materia">Turma: ${item.turma || 'Geral'} | ${item.materia || ''}</span>
              <span class="tag-lab ${labClass}">${item.laboratorio}</span>
              <span class="acao-card">${ehMeuHorario ? '❌ Cancelar' : '🔄 Solicitar Troca'}</span>
            `;

            card.onclick = () => {
              if (ehMeuHorario) {
                cancelarHorario(item.id);
              } else {
                solicitarTroca(item.professor, dia, horario, lab);
              }
            };
          } else {
            card.className = 'card-agendamento vago';
            card.innerHTML = `
              <span class="text-vago">${lab}</span>
              <span class="sub-vago">+ Reservar</span>
            `;
            card.onclick = () => reservarHorario(dia, horario, lab);
          }

          tdHorario.appendChild(card);
        });

        if (totalOcupados === 3) {
          const tagLotado = document.createElement('div');
          tagLotado.className = 'tag-lotado';
          tagLotado.innerHTML = '🔒 Lotado';
          tdHorario.appendChild(tagLotado);
        }

        tr.appendChild(tdHorario);
      });

      corpoTabela.appendChild(tr);
    });
  }

  // --- AÇÕES NOS HORÁRIOS ---
  async function reservarHorario(dia, horario, lab) {
    const turma = prompt(`Qual a turma para a aula de ${professor.materia} no ${lab}?`, '9ºA') || 'Geral';

    const payload = {
      dia_semana: dia,
      horario: horario,
      laboratorio: lab,
      professor: professor.nome_completo,
      materia: professor.materia,
      turma: turma
    };

    try {
      const res = await fetch('http://localhost:3000/horarios/reservar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) carregarGrade();
    } catch (err) {
      alert('Erro ao reservar o horário.');
    }
  }

  async function cancelarHorario(id) {
    if (!confirm('Deseja realmente cancelar e liberar esse horário?')) return;

    try {
      const res = await fetch(`http://localhost:3000/horarios/${id}`, { method: 'DELETE' });
      if (res.ok) carregarGrade();
    } catch (err) {
      alert('Erro ao cancelar o horário.');
    }
  }

  async function solicitarTroca(profDono, dia, horario, lab) {
    const confirmou = confirm(`Deseja solicitar a troca do horário com o(a) Prof. ${profDono}? Isso enviará uma mensagem no painel de avisos.`);
    if (!confirmou) return;

    const mensagem = `Olá Prof. ${profDono}, gostaria de solicitar a troca/liberação do ${lab} na ${dia} às ${horario}.`;
    
    await enviarAviso(mensagem, 'troca');
  }

  // --- MÓDULO DE AVISOS ATUALIZADO ---
async function carregarAvisos() {
  try {
    const res = await fetch('http://localhost:3000/avisos');
    const avisos = await res.json();
    const container = document.getElementById('listaAvisos');
    container.innerHTML = '';

    avisos.forEach(a => {
      const div = document.createElement('div');
      const ehMeuAviso = a.professor_nome === professor.nome_completo;

      div.className = `item-aviso ${a.tipo === 'troca' ? 'aviso-troca' : ''}`;
      div.innerHTML = `
        <div class="topo-item-aviso">
          <strong>${a.professor_nome}</strong>
          ${ehMeuAviso ? `<button class="btn-deletar-aviso" title="Apagar aviso">&times;</button>` : ''}
        </div>
        <p>${a.mensagem}</p>
        <small>${new Date(a.created_at).toLocaleDateString('pt-BR')} ${new Date(a.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</small>
      `;

      // Se for o autor do aviso, adiciona a ação de excluir no botão "X"
      if (ehMeuAviso) {
        const btnDeletar = div.querySelector('.btn-deletar-aviso');
        btnDeletar.onclick = () => excluirAviso(a.id);
      }

      container.appendChild(div);
    });
  } catch (err) {
    console.error('Erro ao carregar avisos:', err);
  }
}

// Função para apagar o aviso no banco
async function excluirAviso(id) {
  if (!confirm('Tem certeza que deseja apagar este aviso do mural?')) return;

  try {
    const res = await fetch(`http://localhost:3000/avisos/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      carregarAvisos(); // Recarrega o mural de avisos
    } else {
      alert('Não foi possível excluir o aviso.');
    }
  } catch (err) {
    alert('Erro na conexão ao tentar excluir o aviso.');
  }
}

  async function enviarAviso(mensagem, tipo = 'geral') {
    try {
      await fetch('http://localhost:3000/avisos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professor_nome: professor.nome_completo,
          mensagem: mensagem,
          tipo: tipo
        })
      });

      document.getElementById('textoAviso').value = '';
      carregarAvisos();
    } catch (err) {
      alert('Erro ao postar aviso.');
    }
  }

  document.getElementById('formAviso').addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = document.getElementById('textoAviso').value;
    if (texto.trim()) enviarAviso(texto, 'geral');
  });

  // Inicialização
  carregarGrade();
  carregarAvisos();
});