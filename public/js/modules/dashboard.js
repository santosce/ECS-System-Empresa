// ===== DASHBOARD MODULE =====
// Módulo de dashboard com gráficos e análises
// VERSÃO REORGANIZADA v4.1.0 - 2 tabs apenas (Projetos e Profissionais)

import { getProfissionais, getProjetos, getAlocacoes } from '../state/app-state.js';
import { formatDate } from '../core/utils.js';

// ===== VARIÁVEIS DE GRÁFICOS =====
let projectGanttChart = null;

// Filtro atual do Gantt
let currentGanttFilter = 'andamento';

// ===== FUNÇÃO PRINCIPAL: ATUALIZAR DASHBOARD =====
export function updateDashboard() {
    console.log('📊 Atualizando dashboard...');
    
    // Atualizar visão de Projetos
    updateProjectsView();
    
    // Atualizar visão de Profissionais
    updateProfessionalsView();
}

// ===== ATUALIZAR VISÃO DE PROJETOS =====
function updateProjectsView() {
    const projetos = getProjetos();
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    // Total de projetos
    const totalProjetos = projetos.length;
    
    // Projetos ativos (não concluídos)
    const projetosAtivos = projetos.filter(p => p.status !== 'Concluído').length;
    
    // Projetos concluídos nos últimos 6 meses
    const projetosConcluidos = projetos.filter(p => {
        if (p.status !== 'Concluído') return false;
        const dataFimStr = p.fimReal || p.fimPrevisto;
        if (!dataFimStr) return false;
        const dataFim = new Date(dataFimStr);
        return dataFim >= sixMonthsAgo;
    }).length;
    
    // Atualizar cards
    const elTotalProj = document.querySelector('[data-metric="dash-total-projetos"]');
    const elAtivos = document.querySelector('[data-metric="dash-projetos-ativos"]');
    const elConcluidos = document.querySelector('[data-metric="dash-projetos-concluidos"]');
    
    if (elTotalProj) elTotalProj.textContent = totalProjetos;
    if (elAtivos) elAtivos.textContent = projetosAtivos;
    if (elConcluidos) elConcluidos.textContent = projetosConcluidos;
    
    // Breakdown por status
    updateProjectStatusBreakdown();
    
    // Atualizar Gantt
    updateProjectGanttChart();
}

// ===== BREAKDOWN DE STATUS DE PROJETOS =====
function updateProjectStatusBreakdown() {
    const container = document.getElementById('project-status-breakdown');
    if (!container) return;
    
    const projetos = getProjetos().filter(p => p.status !== 'Concluído');
    const statusCount = {};
    
    projetos.forEach(p => {
        const status = p.status || 'Sem Status';
        statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    const statusColors = {
        'Planejamento': 'text-blue-600',
        'Em Andamento': 'text-green-600',
        'Pausado': 'text-orange-600',
        'Sem Status': 'text-gray-600'
    };
    
    container.innerHTML = Object.entries(statusCount)
        .map(([status, count]) => `
            <div class="flex justify-between items-center">
                <span class="text-gray-600">${status}</span>
                <span class="font-semibold ${statusColors[status] || 'text-gray-600'}">${count}</span>
            </div>
        `).join('');
}

// ===== GRÁFICO GANTT DE PROJETOS =====
function updateProjectGanttChart() {
    const container = document.getElementById('project-gantt-chart');
    if (!container) return;

    // Aguardar Google Charts Timeline estar disponível
    if (typeof google === 'undefined' || !google.visualization || !google.visualization.Timeline) {
        setTimeout(updateProjectGanttChart, 500);
        return;
    }

    // Aguardar container ter largura real (pode ser 0 se DOM ainda não layoutou)
    if (container.offsetWidth === 0) {
        setTimeout(updateProjectGanttChart, 200);
        return;
    }

    const projetos = getProjetos();
    let projetosFiltrados = [];

    if (currentGanttFilter === 'andamento') {
        projetosFiltrados = projetos.filter(p => p.status === 'Em Andamento' || p.status === 'Não Iniciado');
    } else if (currentGanttFilter === 'concluidos') {
        projetosFiltrados = projetos.filter(p => p.status === 'Concluído');
    } else {
        projetosFiltrados = projetos;
    }

    // Apenas projetos com datas previstas válidas (campos reais do Firestore)
    projetosFiltrados = projetosFiltrados.filter(p => p.inicioPrevisto && p.fimPrevisto);

    if (projetosFiltrados.length === 0) {
        container.innerHTML = '<div class="flex items-center justify-center h-64 text-gray-500">Nenhum projeto encontrado para este filtro</div>';
        return;
    }

    const alocacoes = getAlocacoes();

    const dataTable = new google.visualization.DataTable();
    dataTable.addColumn({ type: 'string', id: 'Projeto' });
    dataTable.addColumn({ type: 'string', id: 'Status' });
    dataTable.addColumn({ type: 'string', role: 'tooltip', p: { html: true } });
    dataTable.addColumn({ type: 'date',   id: 'Inicio' });
    dataTable.addColumn({ type: 'date',   id: 'Fim' });

    projetosFiltrados.forEach(projeto => {
        const inicioStr = projeto.inicioReal || projeto.inicioPrevisto;
        const fimStr    = projeto.fimReal    || projeto.fimPrevisto;
        const [ay, am, ad] = inicioStr.split('-').map(Number);
        const [zy, zm, zd] = fimStr.split('-').map(Number);

        // Profissionais alocados neste projeto (sem repetição e sem percentual)
        const profsAlocados = [...new Set(
            alocacoes
                .filter(a => a.projetoId === projeto.id)
                .map(a => {
                    const prof = getProfissionais().find(p => p.id === a.profissionalId);
                    return prof ? prof.nome : null;
                })
                .filter(Boolean)
        )];

        const labelInicio = projeto.inicioReal
            ? `<strong>Início Real:</strong> ${formatDate(projeto.inicioReal)}<br/><strong>Início Previsto:</strong> ${formatDate(projeto.inicioPrevisto)}`
            : `<strong>Início Previsto:</strong> ${formatDate(projeto.inicioPrevisto)}`;

        const labelFim = projeto.fimReal
            ? `<strong>Fim Real:</strong> ${formatDate(projeto.fimReal)}<br/><strong>Fim Previsto:</strong> ${formatDate(projeto.fimPrevisto)}`
            : `<strong>Fim Previsto:</strong> ${formatDate(projeto.fimPrevisto)}`;

        const tooltip = `
            <div style="padding:10px; font-family:Arial,sans-serif; min-width:200px;">
                <strong style="font-size:13px;">${projeto.nome}</strong><br/>
                <hr style="margin:6px 0; border-color:#eee;"/>
                <strong>Status:</strong> ${projeto.status || '—'}<br/>
                ${labelInicio}<br/>
                ${labelFim}<br/>
                <strong>Cliente:</strong> ${projeto.cliente || '—'}<br/>
                <strong>Tipo:</strong> ${projeto.tipo || '—'}<br/>
                ${profsAlocados.length > 0
                    ? `<hr style="margin:6px 0; border-color:#eee;"/><strong>Profissionais:</strong><br/>${profsAlocados.map(p => `• ${p}`).join('<br/>')}`
                    : ''}
            </div>
        `;

        dataTable.addRow([
            projeto.nome,
            projeto.status || 'Sem Status',
            tooltip,
            new Date(ay, am - 1, ad),
            new Date(zy, zm - 1, zd),
        ]);
    });

    const rowHeight = 42;
    const chartHeight = Math.max(200, projetosFiltrados.length * rowHeight + 50);

    const options = {
        timeline: {
            showRowLabels: true,
            groupByRowLabel: false,
            barLabelStyle: { fontSize: 11 },
        },
        tooltip: { isHtml: true },
        width: container.offsetWidth,
        height: chartHeight,
        backgroundColor: '#fafafa',
        colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
    };

    // Ajustar altura do container para evitar scroll interno desnecessário
    container.style.height = chartHeight + 'px';

    if (projectGanttChart) {
        projectGanttChart.clearChart();
    }

    projectGanttChart = new google.visualization.Timeline(container);
    projectGanttChart.draw(dataTable, options);
    console.log(`📊 Gantt renderizado: ${projetosFiltrados.length} projetos, filtro: ${currentGanttFilter}`);
}

// ===== ATUALIZAR VISÃO DE PROFISSIONAIS =====
function updateProfessionalsView() {
    const profissionais = getProfissionais().filter(p => p.ativo !== 'Não');
    const alocacoes = getAlocacoes();
    const today = new Date();
    
    // Total de profissionais
    const totalProfs = profissionais.length;
    
    // Profissionais alocados hoje
    const profsAlocadosSet = new Set();
    alocacoes.forEach(aloc => {
        const start = new Date(aloc.dataInicio);
        const end = new Date(aloc.dataFim);
        if (start <= today && end >= today) {
            profsAlocadosSet.add(aloc.profissionalId);
        }
    });
    const totalAlocados = profsAlocadosSet.size;
    const totalDesalocados = totalProfs - totalAlocados;
    
    // Percentuais
    const percentAlocados = totalProfs > 0 ? Math.round((totalAlocados / totalProfs) * 100) : 0;
    const percentDesalocados = 100 - percentAlocados;
    
    // Atualizar cards
    const elTotalProfs = document.querySelector('[data-metric="dash-total-profs"]');
    const elTotalProfsPerfil = document.querySelector('[data-metric="dash-total-profs-perfil"]');
    const elAlocados = document.querySelector('[data-metric="dash-profs-alocados"]');
    const elDesalocados = document.querySelector('[data-metric="dash-profs-desalocados"]');
    const elPercentAlocados = document.querySelector('[data-metric="dash-percent-alocados"]');
    const elPercentDesalocados = document.querySelector('[data-metric="dash-percent-desalocados"]');
    
    if (elTotalProfs) elTotalProfs.textContent = totalProfs;
    if (elTotalProfsPerfil) elTotalProfsPerfil.textContent = totalProfs;
    if (elAlocados) elAlocados.textContent = totalAlocados;
    if (elDesalocados) elDesalocados.textContent = totalDesalocados;
    if (elPercentAlocados) elPercentAlocados.textContent = percentAlocados;
    if (elPercentDesalocados) elPercentDesalocados.textContent = percentDesalocados;
    
    // Breakdown por perfil
    updateProfileBreakdown();

    // Atualizar opções do select de perfil (caso dados ainda não existissem no setup)
    const perfilSelect = document.getElementById('disp-filter-perfil');
    if (perfilSelect) {
        const valorAtual = perfilSelect.value;
        const perfis = [...new Set(profissionais.map(p => p.perfil).filter(Boolean))].sort();
        perfilSelect.innerHTML = '<option value="">Todos os Perfis</option>' +
            perfis.map(pf => `<option value="${pf}">${pf}</option>`).join('');
        perfilSelect.value = valorAtual;
    }

    // Renderizar tabela de disponíveis
    renderAvailableProfessionals();
}

// ===== BREAKDOWN POR PERFIL =====
function updateProfileBreakdown() {
    const container = document.getElementById('profile-breakdown');
    if (!container) return;
    
    const profissionais = getProfissionais().filter(p => p.ativo !== 'Não');
    const perfilCount = {};
    
    profissionais.forEach(p => {
        const perfil = p.perfil || 'Sem Perfil';
        perfilCount[perfil] = (perfilCount[perfil] || 0) + 1;
    });
    
    const perfilColors = {
        'Desenvolvedor': 'text-blue-600',
        'Designer': 'text-pink-600',
        'PO': 'text-orange-600',
        'QA': 'text-green-600',
        'Arquiteto': 'text-purple-600'
    };
    
    container.innerHTML = Object.entries(perfilCount)
        .map(([perfil, count]) => `
            <div class="flex justify-between items-center">
                <span class="text-gray-600">${perfil}</span>
                <span class="font-semibold ${perfilColors[perfil] || 'text-gray-600'}">${count}</span>
            </div>
        `).join('');
}

// ===== RENDERIZAR TABELA DE PROFISSIONAIS DISPONÍVEIS =====
function renderAvailableProfessionals() {
    const tbody = document.getElementById('profissionais-disponiveis-table');
    if (!tbody) return;

    const filterNome  = document.getElementById('disp-filter-nome')?.value.toLowerCase().trim() || '';
    const filterPerfil = document.getElementById('disp-filter-perfil')?.value || '';

    let profissionais = getProfissionais().filter(p => p.ativo !== 'Não');
    if (filterNome)   profissionais = profissionais.filter(p => p.nome.toLowerCase().includes(filterNome));
    if (filterPerfil) profissionais = profissionais.filter(p => p.perfil === filterPerfil);
    const alocacoes = getAlocacoes();
    const projetos = getProjetos();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const limite60dias = new Date(hoje);
    limite60dias.setDate(hoje.getDate() + 60);

    const disponivelAgoraData  = [];
    const disponivelEmBreveData = [];

    profissionais.forEach(prof => {
        // Descartar alocações em projetos Concluídos
        const alocacoesProf = alocacoes
            .filter(a => {
                if (a.profissionalId !== prof.id) return false;
                const projeto = projetos.find(p => p.id === a.projetoId);
                if (projeto?.status === 'Concluído') return false;
                return true;
            })
            .sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio));

        // Última alocação (maior dataFim)
        const ultimaAlocacao = alocacoesProf.length > 0
            ? alocacoesProf.reduce((max, a) =>
                new Date(a.dataFim) > new Date(max.dataFim) ? a : max)
            : null;
        const alocadoAte = ultimaAlocacao ? formatDate(ultimaAlocacao.dataFim) : '—';

        // Alocações ativas hoje e % total alocado
        const alocacoesAtivas = alocacoesProf.filter(a =>
            new Date(a.dataInicio + 'T00:00:00') <= hoje &&
            new Date(a.dataFim + 'T00:00:00') >= hoje
        );
        const percentualAtual = alocacoesAtivas.reduce((sum, a) => sum + (parseInt(a.percentual) || 0), 0);

        // Helper: soma % de todas as alocações que começam em determinada data
        const pctNaData = (dataInicio) => alocacoesProf
            .filter(a => a.dataInicio === dataInicio)
            .reduce((sum, a) => sum + (parseInt(a.percentual) || 0), 0);

        if (percentualAtual < 100) {
            // ── GRUPO A: Disponíveis Agora (0% ou parcialmente alocado) ──
            const percentualDisponivel = 100 - percentualAtual;

            // Próxima alocação futura
            const proximaAlocacao = alocacoesProf.find(a =>
                new Date(a.dataInicio + 'T00:00:00') > hoje
            ) || null;

            const disponivelAte = proximaAlocacao
                ? formatDate(new Date(new Date(proximaAlocacao.dataInicio + 'T00:00:00').getTime() - 86400000))
                : '∞';

            const percentualProxima = proximaAlocacao
                ? pctNaData(proximaAlocacao.dataInicio) + '%'
                : '—';

            const proximaData    = proximaAlocacao ? formatDate(proximaAlocacao.dataInicio) : '—';
            const proximoProjeto = proximaAlocacao
                ? (projetos.find(p => p.id === proximaAlocacao.projetoId)?.nome || 'Projeto Desconhecido')
                : 'Sem alocação';

            disponivelAgoraData.push({
                nome: prof.nome,
                perfil: prof.perfil || '—',
                alocadoAte,
                percentualAtual: percentualAtual + '%',
                disponivelDe: formatDate(hoje),
                disponivelAte,
                percentualDisponivel: percentualDisponivel + '%',
                proximaData,
                percentualProxima,
                proximoProjeto,
                isAvailableNow: true
            });
        } else {
            // ── GRUPO B: 100% alocado agora — verificar se libera em ≤ 60 dias ──
            if (alocacoesAtivas.length === 0) return;

            const fimBlocoAtivo = alocacoesAtivas
                .reduce((max, a) => new Date(a.dataFim) > new Date(max.dataFim) ? a : max);
            const dataFimBloco   = new Date(fimBlocoAtivo.dataFim + 'T00:00:00');
            const disponivelDeDate = new Date(dataFimBloco.getTime() + 86400000);

            if (disponivelDeDate > limite60dias) return;

            // Próxima alocação após o fim do bloco ativo
            const proximaAlocacao = alocacoesProf.find(a =>
                new Date(a.dataInicio + 'T00:00:00') > dataFimBloco
            ) || null;

            // Sem gap real: próxima começa no mesmo dia ou antes da disponibilidade
            if (proximaAlocacao) {
                const proximaDataInicio = new Date(proximaAlocacao.dataInicio + 'T00:00:00');
                if (proximaDataInicio <= disponivelDeDate) return;
            }

            const disponivelAte = proximaAlocacao
                ? formatDate(new Date(new Date(proximaAlocacao.dataInicio + 'T00:00:00').getTime() - 86400000))
                : '∞';

            const percentualProxima = proximaAlocacao
                ? pctNaData(proximaAlocacao.dataInicio) + '%'
                : '—';

            const proximaData    = proximaAlocacao ? formatDate(proximaAlocacao.dataInicio) : '—';
            const proximoProjeto = proximaAlocacao
                ? (projetos.find(p => p.id === proximaAlocacao.projetoId)?.nome || 'Projeto Desconhecido')
                : 'Sem alocação';

            disponivelEmBreveData.push({
                nome: prof.nome,
                perfil: prof.perfil || '—',
                alocadoAte,
                percentualAtual: '100%',
                disponivelDe: formatDate(disponivelDeDate),
                disponivelAte,
                percentualDisponivel: '100%',
                proximaData,
                percentualProxima,
                proximoProjeto,
                isAvailableNow: false
            });
        }
    });

    disponivelAgoraData.sort((a, b)   => a.nome.localeCompare(b.nome));
    disponivelEmBreveData.sort((a, b) => a.nome.localeCompare(b.nome));

    const disponiveisData = [...disponivelAgoraData, ...disponivelEmBreveData];

    updateAvailabilityAlert(disponiveisData);

    if (disponiveisData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="px-6 py-8 text-center text-gray-500">Nenhum profissional disponível no momento</td></tr>';
        return;
    }

    const perfilBadges = {
        'Desenvolvedor': 'bg-blue-100 text-blue-800',
        'Designer':      'bg-pink-100 text-pink-800',
        'PO':            'bg-orange-100 text-orange-800',
        'QA':            'bg-green-100 text-green-800',
        'Arquiteto':     'bg-purple-100 text-purple-800'
    };

    const renderRow = (prof) => {
        const pctAtualNum = parseInt(prof.percentualAtual) || 0;
        const pctDispNum  = parseInt(prof.percentualDisponivel) || 0;
        const corAtual    = pctAtualNum >= 100 ? 'text-red-600' : pctAtualNum > 0 ? 'text-amber-600' : 'text-green-600';
        const corDisp     = pctDispNum === 100 ? 'text-green-600' : pctDispNum > 0 ? 'text-amber-600' : 'text-red-600';
        return `
        <tr class="border-b hover:bg-gray-50">
            <td class="px-6 py-4 font-medium text-gray-900">${prof.nome}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${perfilBadges[prof.perfil] || 'bg-gray-100 text-gray-800'}">
                    ${prof.perfil}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">${prof.alocadoAte}</td>
            <td class="px-6 py-4 text-sm text-center">
                <span class="font-semibold ${corAtual}">${prof.percentualAtual}</span>
            </td>
            <td class="px-6 py-4 text-sm">
                <span class="font-semibold ${prof.disponivelAte === '∞' ? 'text-red-600' : 'text-gray-700'}">
                    ${prof.disponivelDe} — ${prof.disponivelAte}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-center">
                <span class="font-semibold ${corDisp}">${prof.percentualDisponivel}</span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">${prof.proximaData}</td>
            <td class="px-6 py-4 text-sm text-center">
                <span class="${prof.percentualProxima === '—' ? 'text-gray-400' : 'font-semibold text-gray-700'}">${prof.percentualProxima}</span>
            </td>
            <td class="px-6 py-4 text-sm ${prof.proximoProjeto === 'Sem alocação' ? 'text-red-600 italic' : 'text-gray-700'}">
                ${prof.proximoProjeto}
            </td>
        </tr>`;
    };

    let html = '';

    if (disponivelAgoraData.length > 0) {
        html += `<tr class="bg-green-50"><td colspan="9" class="px-6 py-2 text-xs font-bold text-green-700 uppercase tracking-wider">Disponíveis Agora</td></tr>`;
        html += disponivelAgoraData.map(renderRow).join('');
    }

    if (disponivelEmBreveData.length > 0) {
        html += `<tr class="bg-amber-50"><td colspan="9" class="px-6 py-2 text-xs font-bold text-amber-700 uppercase tracking-wider">Disponíveis em Breve</td></tr>`;
        html += disponivelEmBreveData.map(renderRow).join('');
    }

    tbody.innerHTML = html;

    console.log(`✅ ${disponivelAgoraData.length} disponíveis agora, ${disponivelEmBreveData.length} em breve`);
}

// ===== ATUALIZAR ALERTA DE DISPONIBILIDADE =====
function updateAvailabilityAlert(disponiveisData) {
    const alert = document.getElementById('availability-alert');
    const alertText = document.getElementById('availability-alert-text');
    
    if (!alert || !alertText) return;
    
    const disponiveisAgora = disponiveisData.filter(p => p.isAvailableNow).length;
    
    if (disponiveisAgora > 0) {
        alert.classList.remove('hidden');
        alertText.textContent = `${disponiveisAgora} profissiona${disponiveisAgora > 1 ? 'is' : 'l'} ${disponiveisAgora > 1 ? 'estão' : 'está'} disponível${disponiveisAgora > 1 ? 'is' : ''} para alocação imediata.`;
    } else {
        alert.classList.add('hidden');
    }
}

// ===== EXPORTAR PROFISSIONAIS DISPONÍVEIS PARA EXCEL =====
function exportAvailableProfessionals() {
    const tbody = document.getElementById('profissionais-disponiveis-table');
    if (!tbody || tbody.rows.length === 0) {
        alert('Nenhum dado para exportar');
        return;
    }
    
    // Preparar dados
    const data = [
        ['Nome', 'Perfil', 'Alocado até', '% Alocado', 'Disponível de - até', '% Disponível', 'Próxima Alocação', '% Próx. Alocação', 'Projeto']
    ];

    Array.from(tbody.rows).forEach(row => {
        const cells = row.cells;
        // Pular linhas de separador de grupo (colspan=9)
        if (cells.length === 1) return;
        if (cells.length >= 9) {
            data.push([
                cells[0].textContent.trim(),
                cells[1].textContent.trim(),
                cells[2].textContent.trim(),
                cells[3].textContent.trim(),
                cells[4].textContent.trim(),
                cells[5].textContent.trim(),
                cells[6].textContent.trim(),
                cells[7].textContent.trim(),
                cells[8].textContent.trim()
            ]);
        }
    });
    
    // Criar workbook
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Disponíveis');
    
    // Download
    const hoje = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `profissionais_disponiveis_${hoje}.xlsx`);
    
    console.log('✅ Excel exportado');
}

// ===== POPULAR FILTROS DO DASHBOARD =====
export function populateDashboardFilters() {
    const profissionais = getProfissionais().filter(p => p.ativo !== 'Não');
    const projetos = getProjetos();

    const times   = [...new Set(profissionais.map(p => p.time).filter(Boolean))].sort();
    const lideres = [...new Set(profissionais.map(p => p.lider).filter(Boolean))].sort();
    const statuses = [...new Set(projetos.map(p => p.status).filter(Boolean))].sort();

    // ── Por Profissional ──────────────────────────────────────────
    const elTime = document.getElementById('dashboard-filter-time');
    if (elTime) {
        const cur = elTime.value;
        elTime.innerHTML = '<option value="">Todos os Times</option>' +
            times.map(t => `<option value="${t}">${t}</option>`).join('');
        elTime.value = cur;
    }

    const elLider = document.getElementById('dashboard-filter-lider');
    if (elLider) {
        const cur = elLider.value;
        elLider.innerHTML = '<option value="">Todos Líderes</option>' +
            lideres.map(l => `<option value="${l}">${l}</option>`).join('');
        elLider.value = cur;
    }

    const elProjeto = document.getElementById('dashboard-filter-projeto');
    if (elProjeto) {
        const cur = elProjeto.value;
        elProjeto.innerHTML = '<option value="">Todos Projetos</option>' +
            projetos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
        elProjeto.value = cur;
    }

    // ── Por Projeto ───────────────────────────────────────────────
    const elProjTime = document.getElementById('project-dashboard-filter-time');
    if (elProjTime) {
        const cur = elProjTime.value;
        elProjTime.innerHTML = '<option value="">Todos Times</option>' +
            times.map(t => `<option value="${t}">${t}</option>`).join('');
        elProjTime.value = cur;
    }

    const elProjLider = document.getElementById('project-dashboard-filter-lider');
    if (elProjLider) {
        const cur = elProjLider.value;
        elProjLider.innerHTML = '<option value="">Todos Líderes</option>' +
            lideres.map(l => `<option value="${l}">${l}</option>`).join('');
        elProjLider.value = cur;
    }

    const statusContainer = document.getElementById('project-dashboard-filter-status');
    if (statusContainer) {
        const marcados = new Set(
            Array.from(statusContainer.querySelectorAll('.project-status-filter:checked')).map(cb => cb.value)
        );
        statusContainer.innerHTML = statuses.map(s => `
            <label class="flex items-center gap-1 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" class="project-status-filter" value="${s}" ${marcados.has(s) ? 'checked' : ''}>
                ${s}
            </label>
        `).join('');
    }

    console.log('📋 Filtros do dashboard populados');
}

// ===== SETUP EVENT LISTENERS =====
export function setupDashboardEventListeners() {
    console.log('🎯 Configurando event listeners do dashboard...');
    
    // Tabs do dashboard
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Atualizar tabs
            document.querySelectorAll('.dashboard-tab').forEach(t => {
                t.classList.remove('active', 'border-indigo-600', 'text-indigo-600');
                t.classList.add('border-transparent', 'text-gray-500');
            });
            tab.classList.add('active', 'border-indigo-600', 'text-indigo-600');
            tab.classList.remove('border-transparent', 'text-gray-500');
            
            // Atualizar conteúdo
            document.querySelectorAll('.dashboard-tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(`tab-${targetTab}`)?.classList.remove('hidden');
            
            // Atualizar gráficos se necessário
            if (targetTab === 'projetos') {
                setTimeout(updateProjectGanttChart, 250);
            }
            
            console.log(`📑 Tab ativa: ${targetTab}`);
        });
    });
    
    // Filtros do Gantt
    document.querySelectorAll('.gantt-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentGanttFilter = btn.dataset.filter;
            
            // Atualizar botões
            document.querySelectorAll('.gantt-filter-btn').forEach(b => {
                b.classList.remove('bg-indigo-600', 'text-white');
                b.classList.add('bg-white', 'text-gray-700', 'border-gray-300');
            });
            btn.classList.add('bg-indigo-600', 'text-white');
            btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300');
            
            // Atualizar gráfico
            updateProjectGanttChart();
        });
    });
    
    // Botão de exportar
    const exportBtn = document.getElementById('export-disponiveis-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportAvailableProfessionals);
    }

    // Filtros de Profissionais Disponíveis
    document.getElementById('disp-filter-nome')?.addEventListener('input', renderAvailableProfessionals);
    document.getElementById('disp-filter-perfil')?.addEventListener('change', renderAvailableProfessionals);

    // Popular select de perfis
    const perfilSelect = document.getElementById('disp-filter-perfil');
    if (perfilSelect) {
        const perfis = [...new Set(getProfissionais().filter(p => p.ativo !== 'Não').map(p => p.perfil).filter(Boolean))].sort();
        perfilSelect.innerHTML = '<option value="">Todos os Perfis</option>' +
            perfis.map(pf => `<option value="${pf}">${pf}</option>`).join('');
    }

    console.log('✅ Event listeners do dashboard configurados');
}

// ===== EXPORT DEFAULT =====
export { updateProjectGanttChart };

export default {
    updateDashboard,
    populateDashboardFilters,
    setupDashboardEventListeners
};