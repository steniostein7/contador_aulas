let calendarioExcecoes = [];
let aulasPorDia = {};

// Carrega o seu JSON
fetch('calendario.json')
    .then(response => response.json())
    .then(data => calendarioExcecoes = data);

function gerarContagem() {
    const trimestre = document.getElementById('trimestre').value;
    aulasPorDia = {
        0: 0, // Domingo
        1: parseInt(document.getElementById('seg').value) || 0,
        2: parseInt(document.getElementById('ter').value) || 0,
        3: parseInt(document.getElementById('qua').value) || 0,
        4: parseInt(document.getElementById('qui').value) || 0,
        5: parseInt(document.getElementById('sex').value) || 0,
        6: 0  // Sábado
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
        const diaSemana = dataAtual.getDay();
        const excecao = calendarioExcecoes.find(e => e.data === dataStr);

        // Lógica Principal
        if (excecao) {
            if (excecao.tipo === "sabado_letivo") {
                const diaCompensado = mapearDiaSemana(excecao.compensa);
                if (aulasPorDia[diaCompensado] > 0) {
                    listagem.push({ data: dataStr, desc: excecao.desc, qtd: aulasPorDia[diaCompensado] });
                }
            }
            // Se for feriado, recesso ou DE, ignora (não entra no else)
        } else if (diaSemana > 0 && diaSemana < 6) { // Dias úteis normais
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
                <td><button class="btn-remove" onclick="removerLinha(${index}, ${item.qtd})"><i class="fas fa-trash"></i></button></td>
            </tr>
        `;
    });

    document.getElementById('totalDisplay').innerText = total;
    document.getElementById('resultado').style.display = 'block';
}

function removerLinha(index, qtd) {
    const linha = document.getElementById(`linha-${index}`);
    linha.remove();
    let display = document.getElementById('totalDisplay');
    display.innerText = parseInt(display.innerText) - qtd;
}
function adicionarDiaExtra() {
    const dataStr = document.getElementById('extraData').value;
    const qtd = parseInt(document.getElementById('extraQtd').value);

    if (!dataStr || qtd <= 0) {
        alert("Por favor, preencha a data e a quantidade de aulas.");
        return;
    }

    const corpo = document.getElementById('listaCorpo');
    const index = Date.now(); // Usando timestamp como ID único para a linha
    const dataFormatada = dataStr.split('-').reverse().join('/');

    // Adiciona a nova linha na tabela
    const novaLinha = `
        <tr id="linha-${index}">
            <td>${dataFormatada}</td>
            <td><i class="fas fa-star" style="color: var(--secondary);"></i> Dia Extra</td>
            <td>${qtd}</td>
            <td><button class="btn-remove" onclick="removerLinha(${index}, ${qtd})"><i class="fas fa-trash"></i></button></td>
        </tr>
    `;

    corpo.insertAdjacentHTML('beforeend', novaLinha);

    // Atualiza o total
    let display = document.getElementById('totalDisplay');
    display.innerText = parseInt(display.innerText) + qtd;

    // Limpa os campos após adicionar
    document.getElementById('extraData').value = '';
}

function limparTudo() {
    // 1. Reseta os inputs de quantidade de aulas para zero
    const IDs = ['seg', 'ter', 'qua', 'qui', 'sex'];
    IDs.forEach(id => document.getElementById(id).value = 0);

    // 2. Reseta o seletor de trimestre para o primeiro
    document.getElementById('trimestre').selectedIndex = 0;

    // 3. Limpa o corpo da tabela
    document.getElementById('listaCorpo').innerHTML = '';

    // 4. Reseta o contador visual
    document.getElementById('totalDisplay').innerText = '0';

    // 5. Esconde o card de resultados novamente
    document.getElementById('resultado').style.display = 'none';

    // 6. Limpa os campos de data extra, se houver
    document.getElementById('extraData').value = '';
    document.getElementById('extraQtd').value = 1;

    // Rola a página para o topo suavemente
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function imprimirResultado() {
    const turma = document.getElementById('nomeTurma').value || "Não informada";
    const trimestre = document.getElementById('trimestre').options[document.getElementById('trimestre').selectedIndex].text;
    const total = document.getElementById('totalDisplay').innerText;
    
    // Cria uma janela de impressão organizada
    const conteudoImpressao = document.getElementById('resultado').cloneNode(true);
    
    // Remove os botões de excluir e o formulário de adicionar da cópia de impressão
    conteudoImpressao.querySelectorAll('.btn-remove, div, button').forEach(el => el.remove());

    const janelaPlanilha = window.open('', '', 'width=800,height=600');
    janelaPlanilha.document.write(`
        <html>
        <head>
            <title>Relatório de Aulas - Professor MG</title>
            <style>
                body { font-family: sans-serif; padding: 20px; }
                h2 { color: #6B3B6F; text-align: center; }
                .info { margin-bottom: 20px; border-bottom: 2px solid #6B3B6F; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total { font-size: 1.2rem; font-weight: bold; margin-top: 20px; text-align: right; }
            </style>
        </head>
        <body>
            <h2>Relatório de Contagem de Aulas</h2>
            <div class="info">
                <p><strong>Turma:</strong> ${turma}</p>
                <p><strong>Período:</strong> ${trimestre}</p>
                <p><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            ${conteudoImpressao.innerHTML}
            <div class="total">Total de Aulas: ${total}</div>
        </body>
        </html>
    `);
    
    janelaPlanilha.document.close();
    janelaPlanilha.print();
}

// Atualize a função limparTudo para resetar o nome da turma também
function limparTudo() {
    document.getElementById('nomeTurma').value = '';
    // ... resto do código da função anterior ...
}
