let calendarioExcecoes = [];

fetch('calendario.json')
    .then(response => response.json())
    .then(data => {
        calendarioExcecoes = data;
    });

// SOLUÇÃO PARA O PROBLEMA DO "0"
document.querySelectorAll('.grid-aulas input').forEach(input => {
    input.addEventListener('focus', function() {
        if (this.value === "0") this.value = "";
    });
    input.addEventListener('blur', function() {
        if (this.value === "") this.value = "0";
    });
});

// Função para descobrir o nome do dia da semana
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

        if (excecao) {
            if (excecao.tipo === "sabado_letivo") {
                const mapaCompensacao = {
                    "segunda-feira": 1, "terça-feira": 2, "quarta-feira": 3, "quinta-feira": 4, "sexta-feira": 5
                };
                const diaCompensado = mapaCompensacao[excecao.compensa];
                if (aulasPorDia[diaCompensado] > 0) {
                    listagem.push({ data: dataStr, qtd: aulasPorDia[diaCompensado] });
                }
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
        const nomeDia = obterNomeDia(item.data); // Obtém o nome do dia

        corpo.innerHTML += `
            <tr id="linha-${i}">
                <td>${dataBr}</td>
                <td>${nomeDia}</td>
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
    document.getElementById(`linha-${index}`).remove();
    let display = document.getElementById('totalDisplay');
    display.innerText = parseInt(display.innerText) - qtd;
}

function adicionarDiaExtra() {
    const dataVal = document.getElementById('extraData').value;
    const qtdVal = parseInt(document.getElementById('extraQtd').value);
    if (!dataVal) return;
    
    const id = Date.now();
    const dataBr = dataVal.split('-').reverse().join('/');
    const nomeDia = obterNomeDia(dataVal);

    document.getElementById('listaCorpo').innerHTML += `
        <tr id="linha-${id}">
            <td>${dataBr}</td>
            <td>${nomeDia} (Extra)</td>
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

function limparTudo() {
    window.location.reload();
}

function imprimirResultado() {
    // Pegar dados da tela
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const turma = document.getElementById('nomeTurma').value || "Não informada";
    const trimestre = document.getElementById('trimestre').options[document.getElementById('trimestre').selectedIndex].text;
    const total = document.getElementById('totalDisplay').innerText;

    // 1. Título e Cabeçalho do PDF
    doc.setFontSize(18);
    doc.setTextColor(107, 59, 111); // Cor --primary (#6B3B6F)
    doc.text("Relatório de Aulas Previstas", 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Turma: ${turma}`, 14, 30);
    doc.text(`Período: ${trimestre}`, 14, 37);
    doc.text(`Total de Aulas: ${total}`, 14, 44);
    
    // 2. Preparar os dados da tabela
    const colunas = ["Data", "Dia da Semana", "Aulas"];
    const linhas = [];
    
    // Varremos a tabela que está na tela para pegar os dados atuais
    const linhasTabela = document.querySelectorAll("#listaCorpo tr");
    linhasTabela.forEach(tr => {
        const celulas = tr.querySelectorAll("td");
        if (celulas.length > 0) {
            linhas.push([
                celulas[0].innerText, // Data
                celulas[1].innerText, // Dia da Semana
                celulas[2].innerText  // Quantidade
            ]);
        }
    });

    // 3. Gerar a Tabela no PDF usando o plugin autoTable
    doc.autoTable({
        startY: 50,
        head: [colunas],
        body: linhas,
        theme: 'striped',
        headStyles: { fillColor: [107, 59, 111] }, // Cor do cabeçalho
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
            2: { halign: 'center' } // Centraliza a coluna de quantidade de aulas
        }
    });

    // 4. Salvar o arquivo
    const nomeArquivo = `Aulas_${turma.replace(/ /g, "_")}_${trimestre.split(' ')[0]}.pdf`;
    doc.save(nomeArquivo);
}
