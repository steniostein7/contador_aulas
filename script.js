let calendarioExcecoes = [];

// Carrega o banco de dados e limpa espaços extras nas datas
fetch('calendario.json')
    .then(response => response.json())
    .then(data => {
        calendarioExcecoes = data.map(item => ({
            ...item,
            data: item.data.trim()
        }));
        console.log("Calendário oficial carregado.");
    });

// Solução para o problema do "0" e do "20" no telemóvel
document.querySelectorAll('.grid-aulas input').forEach(input => {
    input.addEventListener('focus', function() {
        if (this.value === "0") this.value = "";
    });
    input.addEventListener('blur', function() {
        if (this.value === "") this.value = "0";
    });
});

// Nome do dia sem erros de fuso horário
function obterNomeDia(dataString) {
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const partes = dataString.split('-');
    const data = new Date(partes[0], partes[1] - 1, partes[2]);
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
        "1": { inicio: [2026, 2, 4], fim: [2026, 5, 20] },
        "2": { inicio: [2026, 5, 21], fim: [2026, 9, 9] },
        "3": { inicio: [2026, 9, 10], fim: [2026, 12, 18] }
    };

    const limite = limites[trimestre];
    let d = new Date(limite.inicio[0], limite.inicio[1] - 1, limite.inicio[2]);
    const fim = new Date(limite.fim[0], limite.fim[1] - 1, limite.fim[2]);
    
    let listagem = [];

    while (d <= fim) {
        // Formata a data como YYYY-MM-DD manualmente para garantir precisão
        const dataStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        const diaSemanaIndex = d.getDay();
        const excecao = calendarioExcecoes.find(e => e.data === dataStr);

        let deveContar = false;
        let qtd = 0;

        if (excecao) {
            // Se está no JSON, verificamos se é Sábado Letivo
            if (excecao.tipo === "sabado_letivo") {
                const mapa = { "segunda-feira": 1, "terça-feira": 2, "quarta-feira": 3, "quinta-feira": 4, "sexta-feira": 5 };
                const diaComp = mapa[excecao.compensa];
                if (aulasPorDia[diaComp] > 0) {
                    deveContar = true;
                    qtd = aulasPorDia[diaComp];
                }
            }
            // SE FOR FERIADO OU RECESSO, O CÓDIGO NÃO FAZ NADA (deveContar continua false)
        } else {
            // Se NÃO está no JSON, verificamos se é dia útil
            if (diaSemanaIndex >= 1 && diaSemanaIndex <= 5) {
                if (aulasPorDia[diaSemanaIndex] > 0) {
                    deveContar = true;
                    qtd = aulasPorDia[diaSemanaIndex];
                }
            }
        }

        if (deveContar) {
            listagem.push({ data: dataStr, qtd: qtd });
        }

        d.setDate(d.getDate() + 1);
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
            <tr id="lin-${i}">
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

function removerLinha(idx, q) {
    const el = document.getElementById(`lin-${idx}`);
    if (el) {
        el.remove();
        let disp = document.getElementById('totalDisplay');
        disp.innerText = parseInt(disp.innerText) - q;
    }
}

function adicionarDiaExtra() {
    const dataVal = document.getElementById('extraData').value;
    const qtdVal = parseInt(document.getElementById('extraQtd').value);
    
    if (!dataVal) {
        alert("Selecione uma data para adicionar.");
        return;
    }

    // 1. Criamos o objeto do novo dia
    const novoDia = {
        data: dataVal,
        qtd: qtdVal,
        extra: true // Marcamos como extra para identificar na renderização
    };

    // 2. Adicionamos à listagem que já existe (precisamos que a listagem seja global)
    // Para isso funcionar perfeitamente, vamos capturar os dados atuais da tabela
    // Mas a forma mais limpa é interceptar a lista antes de renderizar.
    
    // Vamos usar uma abordagem mais simples: Pegar todos os dados da tabela, 
    // adicionar o novo e reordenar tudo.
    
    let listagemAtual = [];
    
    // Captura o que já está na tabela
    document.querySelectorAll("#listaCorpo tr").forEach(tr => {
        const celulas = tr.querySelectorAll("td");
        // Converte a data BR (DD/MM/YYYY) de volta para ISO (YYYY-MM-DD) para ordenar
        const dataBr = celulas[0].innerText;
        const dataIso = dataBr.split('/').reverse().join('-');
        const nomeDia = celulas[1].innerText;
        const qtdAulas = parseInt(celulas[2].innerText);
        
        listagemAtual.push({ data: dataIso, qtd: qtdAulas, desc: nomeDia });
    });

    // Adiciona o novo dia
    listagemAtual.push({ data: novoDia.data, qtd: novoDia.qtd, desc: obterNomeDia(novoDia.data) + " (Extra)" });

    // 3. Ordena a lista por data
    listagemAtual.sort((a, b) => new Date(a.data) - new Date(b.data));

    // 4. Limpa e reconstrói a tabela ordenada
    renderizarTabelaOrdenada(listagemAtual);
}

// Criamos essa função auxiliar para renderizar sem duplicar o "Dia da Semana"
function renderizarTabelaOrdenada(lista) {
    const corpo = document.getElementById('listaCorpo');
    corpo.innerHTML = '';
    let total = 0;
    
    lista.forEach((item, i) => {
        total += item.qtd;
        const dataBr = item.data.split('-').reverse().join('/');
        
        corpo.innerHTML += `
            <tr id="lin-${i}">
                <td>${dataBr}</td>
                <td>${item.desc}</td>
                <td>${item.qtd}</td>
                <td class="no-print">
                    <button class="btn-remove" onclick="removerLinha(${i}, ${item.qtd})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    });
    document.getElementById('totalDisplay').innerText = total;
}

function limparTudo() { window.location.reload(); }

function imprimirResultado() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const turma = document.getElementById('nomeTurma').value || "Não informada";
    const trimestre = document.getElementById('trimestre').options[document.getElementById('trimestre').selectedIndex].text;
    const total = document.getElementById('totalDisplay').innerText;

    // 1. Cabeçalho do PDF
    doc.setFontSize(16);
    doc.setTextColor(107, 59, 111); // Sua cor primária
    doc.text("Relatório de Aulas Previstas", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Turma: ${turma} | Período: ${trimestre}`, 14, 28);

    // 2. Coleta de dados da tabela
    const linhas = [];
    document.querySelectorAll("#listaCorpo tr").forEach(tr => {
        const c = tr.querySelectorAll("td");
        if (c.length > 0) {
            linhas.push([c[0].innerText, c[1].innerText, c[2].innerText]);
        }
    });

    // 3. Geração da Tabela
    doc.autoTable({
        startY: 35,
        head: [['Data', 'Dia da Semana', 'Aulas']],
        body: linhas,
        theme: 'striped',
        headStyles: { fillColor: [107, 59, 111] },
        didDrawPage: function (data) {
            // --- INÍCIO DO RODAPÉ ---
            doc.setFontSize(8);
            doc.setTextColor(150);
            
            // Texto do crédito
            const rodapeTexto = "Gerado por www.professormg.com.br - Ferramentas de Apoio ao Docente";
            
            // Centralizar o texto no rodapé
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
            
            doc.text(rodapeTexto, pageWidth / 2, pageHeight - 10, { align: 'center' });
            // --- FIM DO RODAPÉ ---
        }
    });

    // 4. Rodapé Final com o Total (opcional, logo após a tabela)
    const finalY = doc.lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total de Aulas: ${total}`, 196, finalY + 10, { align: 'right' });

    doc.save(`Aulas_${turma.replace(/ /g, "_")}.pdf`);
}
