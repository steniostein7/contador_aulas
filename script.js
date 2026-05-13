let calendarioExcecoes = [];

fetch('calendario.json')
    .then(response => response.json())
    .then(data => calendarioExcecoes = data);

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
        const diaSemana = dataAtual.getDay(); // 0=Dom, 1=Seg...
        const excecao = calendarioExcecoes.find(e => e.data === dataStr);

        if (excecao) {
            if (excecao.tipo === "sabado_letivo") {
                const diaCompensado = mapearDiaSemana(excecao.compensa);
                if (aulasPorDia[diaCompensado] > 0) {
                    listagem.push({ data: dataStr, desc: excecao.desc, qtd: aulasPorDia[diaCompensado] });
                }
            }
            // Feriados, Recessos e DE são ignorados automaticamente (não entram no else)
        } else if (diaSemana >= 1 && diaSemana <= 5) {
            if (aulasPorDia[diaSemana] > 0) {
                listagem.push({ data: dataStr, desc: "Aula Regular", qtd: aulasPorDia[diaSemana] });
            }
        }
        dataAtual.setDate(dataAtual.getDate() + 1);
    }

    renderizarTabela(listagem);
}

function mapearDiaSemana(nome) {
    const mapa = { "segunda-feira": 1, "terça-feira": 2, "quarta-feira": 3, "quinta-feira": 4, "sexta-feira": 5 };
    return mapa[nome.toLowerCase()];
}

function renderizarTabela(lista) {
    const corpo = document.getElementById('listaCorpo');
    corpo.innerHTML = '';
    let total = 0;

    lista.forEach((item, index) => {
        total += item.qtd;
        const dataFormatada = item.data.split('-').reverse().join('/');
        corpo.innerHTML += `
            <tr id="linha-${index}">
                <td>${dataFormatada}</td>
                <td>${item.desc}</td>
                <td>${item.qtd}</td>
                <td class="no-print"><button class="btn-remove" onclick="removerLinha(${index}, ${item.qtd})"><i class="fas fa-trash"></i></button></td>
            </tr>
        `;
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
    const dataStr = document.getElementById('extraData').value;
    const qtd = parseInt(document.getElementById('extraQtd').value);
    if (!dataStr || qtd <= 0) return alert("Preencha data e quantidade.");

    const index = Date.now();
    const dataFormatada = dataStr.split('-').reverse().join('/');
    document.getElementById('listaCorpo').innerHTML += `
        <tr id="linha-${index}">
            <td>${dataFormatada}</td>
            <td><i class="fas fa-star" style="color:#FF8A65"></i> Dia Extra</td>
            <td>${qtd}</td>
            <td class="no-print"><button class="btn-remove" onclick="removerLinha(${index}, ${qtd})"><i class="fas fa-trash"></i></button></td>
        </tr>
    `;
    let display = document.getElementById('totalDisplay');
    display.innerText = parseInt(display.innerText) + qtd;
}

function limparTudo() {
    ['seg', 'ter', 'qua', 'qui', 'sex'].forEach(id => document.getElementById(id).value = 0);
    document.getElementById('nomeTurma').value = '';
    document.getElementById('listaCorpo').innerHTML = '';
    document.getElementById('totalDisplay').innerText = '0';
    document.getElementById('resultado').style.display = 'none';
}

function imprimirResultado() {
    const turma = document.getElementById('nomeTurma').value || "Não informada";
    const trimestre = document.getElementById('trimestre').options[document.getElementById('trimestre').selectedIndex].text;
    
    // Abrir janela simples de impressão
    const printWindow = window.open('', '_blank');
    const tableHtml = document.getElementById('tabelaAulas').outerHTML;
    const total = document.getElementById('totalDisplay').innerText;

    printWindow.document.write(`
        <html><head><title>Impressão</title>
        <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #333; padding: 8px; text-align: left; }
            .no-print { display: none; }
            h2 { color: #6B3B6F; }
        </style></head>
        <body>
            <h2>Relatório de Aulas - Professor MG</h2>
            <p><strong>Turma:</strong> ${turma}</p>
            <p><strong>Período:</strong> ${trimestre}</p>
            ${tableHtml}
            <h3>Total de Aulas: ${total}</h3>
            <script>window.print(); window.close();</script>
        </body></html>
    `);
    printWindow.document.close();
}
