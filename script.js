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
    const turma = document.getElementById('nomeTurma').value || "Não informada";
    const trimestre = document.getElementById('trimestre').options[document.getElementById('trimestre').selectedIndex].text;
    const total = document.getElementById('totalDisplay').innerText;
    const tabelaClone = document.getElementById('tabelaAulas').cloneNode(true);
    tabelaClone.querySelectorAll('.no-print').forEach(el => el.remove());

    const win = window.open('', '_blank');
    win.document.write(`
        <html><head><style>
            body { font-family: sans-serif; padding: 20px; font-size: 10pt; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 4px; text-align: left; }
            h2 { color: #6B3B6F; margin: 0; text-align: center; }
            .header { margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
        </style></head>
        <body>
            <div class="header">
                <h2>Relatório de Aulas Previstas</h2>
                <p><strong>Turma:</strong> ${turma} | <strong>Período:</strong> ${trimestre}</p>
            </div>
            ${tabelaClone.outerHTML}
            <h3 style="text-align: right;">Total: ${total} aulas</h3>
            <script>window.print(); window.close();</script>
        </body></html>`);
    win.document.close();
}
