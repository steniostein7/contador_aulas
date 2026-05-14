let calendarioExcecoes = [];

// Carrega o banco de dados
fetch('calendario.json')
    .then(response => response.json())
    .then(data => {
        calendarioExcecoes = data;
        console.log("Calendário carregado.");
    });

// Solução para o problema do "0" e do "20"
document.querySelectorAll('.grid-aulas input').forEach(input => {
    input.addEventListener('focus', function() {
        if (this.value === "0") this.value = "";
    });
    input.addEventListener('blur', function() {
        if (this.value === "") this.value = "0";
    });
});

function obterNomeDia(dataString) {
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    // Adicionamos T12:00:00 para evitar erros de fuso horário no nome do dia
    const data = new Date(dataString + "T12:00:00");
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
    let dataAtual = new Date(periodo.inicio + "T12:00:00");
    const dataFim = new Date(periodo.fim + "T12:00:00");
    let listagem = [];

    while (dataAtual <= dataFim) {
        // Formata a data atual para YYYY-MM-DD para comparar com o JSON
        const ano = dataAtual.getFullYear();
        const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
        const dia = String(dataAtual.getDate()).padStart(2, '0');
        const dataStr = `${ano}-${mes}-${dia}`;
        
        const diaSemanaIndex = dataAtual.getDay();
        const excecao = calendarioExcecoes.find(e => e.data === dataStr);

        let deveContar = false;
        let qtdAulas = 0;

        if (excecao) {
            if (excecao.tipo === "sabado_letivo") {
                const mapa = { "segunda-feira": 1, "terça-feira": 2, "quarta-feira": 3, "quinta-feira": 4, "sexta-feira": 5 };
                const diaComp = mapa[excecao.compensa];
                if (aulasPorDia[diaComp] > 0) {
                    deveContar = true;
                    qtdAulas = aulasPorDia[diaComp];
                }
            } 
            // IMPORTANTE: Se for recesso, feriado ou DE, a variável deveContar continua FALSE
            // e o código pula para o próximo dia.
        } else {
            // Se não está no JSON, verifica se é dia de semana e se tem aula
            if (diaSemanaIndex >= 1 && diaSemanaIndex <= 5) {
                if (aulasPorDia[diaSemanaIndex] > 0) {
                    deveContar = true;
                    qtdAulas = aulasPorDia[diaSemanaIndex];
                }
            }
        }

        if (deveContar) {
            listagem.push({ data: dataStr, qtd: qtdAulas });
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
        corpo.innerHTML += `
            <tr id="linha-${i}">
                <td>${dataBr}</td>
                <td>${obterNomeDia(item.data)}</td>
                <td>${item.qtd}</td>
                <td class="no-print">
                    <button class="btn-remove" onclick="removerLinha(${i}, ${item.qtd})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    });
    document.getElementById('totalDisplay').innerText = total;
    document.getElementById('resultado').style.display = 'block';
}

function removerLinha(index, qtd) {
    const linha = document.getElementById(`linha-${index}`);
    if (linha) {
        linha.remove();
        let display = document.getElementById('totalDisplay');
        display.innerText = parseInt(display.innerText) - qtd;
    }
}

function adicionarDiaExtra() {
    const dataVal = document.getElementById('extraData').value;
    const qtdVal = parseInt(document.getElementById('extraQtd').value);
    if (!dataVal) return;
    
    const id = Date.now();
    const dataBr = dataVal.split('-').reverse().join('/');
    document.getElementById('listaCorpo').innerHTML += `
        <tr id="linha-${id}">
            <td>${dataBr}</td>
            <td>${obterNomeDia(dataVal)} (Extra)</td>
            <td>${qtdVal}</td>
            <td class="no-print">
                <button class="btn-remove" onclick="removerLinha(${id}, ${qtdVal})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`;
    let display = document.getElementById('totalDisplay');
    display.innerText = parseInt(display.innerText) + qtdVal;
}

function limparTudo() { window.location.reload(); }

function imprimirResultado() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const turma = document.getElementById('nomeTurma').value || "Nao informada";
    const trimestre = document.getElementById('trimestre').options[document.getElementById('trimestre').selectedIndex].text;
    const total = document.getElementById('totalDisplay').innerText;

    doc.setFontSize(16);
    doc.text("Relatorio de Aulas Previstas", 14, 20);
    doc.setFontSize(10);
    doc.text(`Turma: ${turma} | Periodo: ${trimestre} | Total: ${total} aulas`, 14, 30);

    const linhas = [];
    document.querySelectorAll("#listaCorpo tr").forEach(tr => {
        const c = tr.querySelectorAll("td");
        if (c.length > 0) linhas.push([c[0].innerText, c[1].innerText, c[2].innerText]);
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
