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
