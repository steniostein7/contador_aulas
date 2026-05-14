let calendarioExcecoes = [];

// Carrega o banco de dados de datas
fetch('calendario.json')
    .then(response => response.json())
    .then(data => {
        calendarioExcecoes = data;
        console.log("Calendário carregado com sucesso.");
    })
    .catch(error => console.error("Erro ao carregar o calendário:", error));

// Lógica para limpar o "0" nos campos de entrada (Mobile)
document.querySelectorAll('.grid-aulas input').forEach(input => {
    input.addEventListener('focus', function() {
        if (this.value === "0") this.value = "";
    });
    input.addEventListener('blur', function() {
        if (this.value === "") this.value = "0";
    });
});

// Converte a data no nome do dia (Segunda, Terça...)
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

        let pularDia = false;

        if (excecao) {
            if (excecao.tipo === "sabado_letivo") {
                const mapaCompensacao = {
                    "segunda-feira": 1, "terça-feira": 2, "quarta-feira": 3, "quinta-feira": 4, "sexta-feira": 5
                };
                const diaCompensado = mapaCompensacao[excecao.compensa];
                if (aulasPorDia[diaCompensado] > 0) {
                    listagem.push({ data: dataStr, qtd: aulasPorDia[diaCompensado] });
                }
                pularDia = true; // Já processou como sábado letivo
            } else if (excecao.tipo === "recesso" || excecao.tipo === "feriado" || excecao.tipo === "DE") {
                pularDia = true; // É um dia de folga, não faz nada
            }
        }

        // Se não for uma exceção que mandou pular e for dia de semana
        if (!pularDia && diaSemanaIndex >= 1 && diaSemanaIndex <= 5) {
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
        const nomeDia = obterNomeDia(item.data);

        corpo.innerHTML += `
            <tr id="linha-${i}">
                <td>${dataBr}</td>
                <td>${nomeDia}</td>
                <td>${item.qtd}</td>
                <td class="no-print">
                    <button class="btn-remove" onclick="removerLinha(${i}, ${item.qtd})" style="color:red; background:none; border:none; cursor:pointer;">
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
    const nomeDia = obterNomeDia(dataVal);

    document.getElementById('listaCorpo').innerHTML += `
        <tr id="linha-${id}">
            <td>${dataBr}</td>
            <td>${nomeDia} (Extra)</td>
            <td>${qtdVal}</td>
            <td class="no-print">
                <button class="btn-remove" onclick="removerLinha(${id}, ${qtdVal})" style="color:red; background:none; border:none; cursor:pointer;">
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
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const turma = document.getElementById('nomeTurma').value || "Nao informada";
    const trimestre = document.getElementById('trimestre').options[document.getElementById('trimestre').selectedIndex].text;
    const total = document.getElementById('totalDisplay').innerText;

    doc.setFontSize(16);
    doc.text("Relatorio de Aulas Previstas", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Turma: ${turma} | Periodo: ${trimestre}`, 14, 30);
    doc.text(`Total de Aulas: ${total}`, 14, 37);

    const colunas = ["Data", "Dia da Semana", "Aulas"];
    const linhas = [];
    
    document.querySelectorAll("#listaCorpo tr").forEach(tr => {
        const celulas = tr.querySelectorAll("td");
        if (celulas.length > 0) {
            linhas.push([celulas[0].innerText, celulas[1].innerText, celulas[2].innerText]);
        }
    });

    doc.autoTable({
        startY: 45,
        head: [colunas],
        body: linhas,
        theme: 'striped',
        headStyles: { fillColor: [107, 59, 111] }
    });

    doc.save(`Aulas_${turma}.pdf`);
}
