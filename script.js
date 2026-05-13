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
    const total = document.getElementById('totalDisplay').innerText;
    
    // Pegamos apenas o corpo da tabela para não levar botões de excluir
    const tabelaOriginal = document.getElementById('tabelaAulas').cloneNode(true);
    tabelaOriginal.querySelectorAll('.no-print').forEach(el => el.remove());

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Relatório - ${turma}</title>
            <style>
                body { font-family: sans-serif; padding: 10px; font-size: 10pt; color: #000; }
                h2 { margin: 0; color: #6B3B6F; font-size: 14pt; text-align: center; }
                .header-info { margin: 10px 0; border-bottom: 1px solid #ccc; padding-bottom: 5px; display: flex; justify-content: space-between; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #000; padding: 3px 6px; text-align: left; font-size: 9pt; }
                th { background-color: #f2f2f2; }
                .total { font-weight: bold; font-size: 11pt; margin-top: 10px; text-align: right; }
                @page { margin: 1cm; }
            </style>
        </head>
        <body>
            <h2>Contagem de Aulas</h2>
            <div class="header-info">
                <span><strong>Turma:</strong> ${turma}</span>
                <span><strong>Período:</strong> ${trimestre}</span>
            </div>
            ${tabelaOriginal.outerHTML}
            <div class="total">Total de Aulas Previstas: ${total}</div>
            <script>
                setTimeout(() => { window.print(); window.close(); }, 500);
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}
// Seleciona todos os inputs de dias da semana
const inputsAulas = document.querySelectorAll('.day-input input');

inputsAulas.forEach(input => {
    // Quando o usuário clica/toca no campo
    input.addEventListener('focus', function() {
        if (this.value === "0") {
            this.value = ""; // Limpa o zero para o professor digitar direto
        }
    });

    // Quando o usuário sai do campo sem digitar nada
    input.addEventListener('blur', function() {
        if (this.value === "") {
            this.value = "0"; // Volta para zero se ficar vazio
        }
    });
});
