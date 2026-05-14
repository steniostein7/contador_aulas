let calendarioExcecoes = [];

fetch('calendario.json')
    .then(response => response.json())
    .then(data => { calendarioExcecoes = data; });

// Problema do "0" e "20"
document.querySelectorAll('.grid-aulas input').forEach(input => {
    input.addEventListener('focus', function() { if (this.value === "0") this.value = ""; });
    input.addEventListener('blur', function() { if (this.value === "") this.value = "0"; });
});

function obterNomeDia(dataString) {
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const data = new Date(dataString + "T00:00:00");
    return dias[data.getDay()];
}

function gerarContagem() {
    const trimestre = document.getElementById('trimestre').value;
    const aulasPorDia = {
        1: parseInt(document.getElementById('seg').value) || 0,
        2: parseInt(document.getElementById('ter').value) || 0,
        3: parseInt(document.getElementById('qua').value) || 0,
        4: parseInt(document.getElementById('qui').value) || 0,
        5: parseInt(document.getElementById('sex').value) || 0
    };

    const limites = {
        "1": { inicio: "2026-02-04", fim: "2026-05-20" },
        "2": { inicio: "2026-05-21", fim: "2026-09-09" },
        "3": { inicio: "2026-09-10", fim: "2026-12-18" }
    };

    const periodo = limites[trimestre];
    let dataAtual = new Date(periodo.inicio + "T00:00:00");
    const dataFim = new Date(periodo.fim + "T00:00:00");
    let listagem = [];

    while (dataAtual <= dataFim) {
        const dataStr = dataAtual.toISOString().split('T')[0];
        const diaSemanaIndex = dataAtual.getDay();
        const excecao = calendarioExcecoes.find(e => e.data === dataStr);

        // LÓGICA CORRIGIDA:
        if (excecao) {
            if (excecao.tipo === "sabado_letivo") {
                const mapaCompensacao = { "segunda-feira": 1, "terça-feira": 2, "quarta-feira": 3, "quinta-feira": 4, "sexta-feira": 5 };
                const diaCompensado = mapaCompensacao[excecao.compensa];
                if (aulasPorDia[diaCompensado] > 0) {
                    listagem.push({ data: dataStr, qtd: aulasPorDia[diaCompensado] });
                }
            } else if (excecao.tipo === "recesso" || excecao.tipo === "feriado" || excecao.tipo === "DE") {
                // SE FOR EXCEÇÃO NÃO LETIVA, PULA PARA O PRÓXIMO DIA SEM CONTAR
                dataAtual.setDate(dataAtual.getDate() + 1);
                continue; 
            }
        } else if (diaSemanaIndex >= 1 && diaSemanaIndex <= 5) {
            if (aulasPorDia[diaSemanaIndex] > 0) {
                listagem.push({ data: dataStr, qtd: aulasPorDia[diaSemanaIndex] });
            }
        }
        dataAtual.setDate(dataAtual.getDate() + 1);
    }
    renderizarTabela(listagem);
}

function renderizarTabela(lista) {
    const corpo = document.getElementById('listaCorpo');
    corpo.innerHTML = '';
    let total = 0;
    lista.forEach((item, i) => {
        total += item.qtd;
        const dataBr = item.data.split('-').reverse().join('/');
        corpo.innerHTML += `<tr id="l-${i}"><td>${dataBr}</td><td>${obterNomeDia(item.data)}</td><td>${item.qtd}</td><td class="no-print"><button class="btn-remove" onclick="removerLinha(${i},${item.qtd})"><i class="fas fa-trash"></i></button></td></tr>`;
    });
    document.getElementById('totalDisplay').innerText = total;
    document.getElementById('resultado').style.display = 'block';
}

function removerLinha(i, q) {
    document.getElementById(`l-${i}`).remove();
    let d = document.getElementById('totalDisplay');
    d.innerText = parseInt(d.innerText) - q;
}

function adicionarDiaExtra() {
    const d = document.getElementById('extraData').value;
    const q = parseInt(document.getElementById('extraQtd').value);
    if (!d) return;
    const i = Date.now();
    document.getElementById('listaCorpo').innerHTML += `<tr id="l-${i}"><td>${d.split('-').reverse().join('/')}</td><td>${obterNomeDia(d)} (Extra)</td><td>${q}</td><td class="no-print"><button class="btn-remove" onclick="removerLinha(${i},${q})"><i class="fas fa-trash"></i></button></td></tr>`;
    let disp = document.getElementById('totalDisplay');
    disp.innerText = parseInt(disp.innerText) + q;
}

function limparTudo() { window.location.reload(); }

// FUNÇÃO DE PDF PARA CELULAR
function imprimirResultado() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const turma = document.getElementById('nomeTurma').value || "Não informada";
    const trimestre = document.getElementById('trimestre').options[document.getElementById('trimestre').selectedIndex].text;
    const total = document.getElementById('totalDisplay').innerText;

    doc.setFontSize(16);
    doc.text("Relatório de Aulas Previstas", 14, 20);
    doc.setFontSize(10);
    doc.text(`Turma: ${turma} | Período: ${trimestre} | Total: ${total} aulas`, 14, 30);

    const linhas = [];
    document.querySelectorAll("#listaCorpo tr").forEach(tr => {
        const c = tr.querySelectorAll("td");
        linhas.push([c[0].innerText, c[1].innerText, c[2].innerText]);
    });

    doc.autoTable({
        startY: 35,
        head: [['Data', 'Dia da Semana', 'Aulas']],
        body: linhas,
        theme: 'striped',
        headStyles: { fillColor: [107, 59, 111] }
    });

    doc.save(`Aulas_${turma}.pdf`);
}
