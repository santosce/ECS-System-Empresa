// ===== TIMELINE MODULE =====
// Módulo de visualização de timeline/Gantt
// Extraído de app.js na refatoração v4.0.0

import { getProfissionais, getProjetos, getAlocacoes } from '../state/app-state.js';
import { formatDate } from '../core/utils.js';
import { setOpenedFromTimeline } from '../core/navigation.js';
import { openAlocacaoModal } from './allocations.js';

// ===== DESENHAR TIMELINE CHART =====
export function drawTimelineChart() {
    const container = document.getElementById('timeline-chart-container');
    if (!container) {
        console.warn('⚠️ Container da timeline não encontrado');
        return;
    }

    if (typeof google === 'undefined' || !google.visualization) {
        console.warn('⚠️ Google Charts não carregado ainda');
        setTimeout(drawTimelineChart, 500);
        return;
    }

    const filterProf   = document.getElementById('timeline-filter-profissional')?.value || '';
    const filterProj   = document.getElementById('timeline-filter-projeto')?.value || '';
    const filterPerfil = document.getElementById('timeline-filter-perfil')?.value || '';
    const filterStatus = document.getElementById('timeline-filter-status')?.value || '';
    const filterTime   = document.getElementById('timeline-filter-time')?.value || '';

    let alocacoes = getAlocacoes().filter(a => {
        const prof = getProfissionais().find(p => p.id === a.profissionalId);
        const proj = getProjetos().find(p => p.id === a.projetoId);
        if (!prof || prof.ativo === 'Não' || !prof.nome) return false;
        if (filterProf   && a.profissionalId !== filterProf)   return false;
        if (filterProj   && a.projetoId      !== filterProj)   return false;
        if (filterPerfil && prof.perfil       !== filterPerfil) return false;
        if (filterStatus && proj?.status      !== filterStatus) return false;
        if (filterTime   && prof.time         !== filterTime)   return false;
        return true;
    });

    alocacoes.sort((a, b) => {
        const profA = getProfissionais().find(p => p.id === a.profissionalId);
        const profB = getProfissionais().find(p => p.id === b.profissionalId);
        return (profA?.nome || '').localeCompare(profB?.nome || '');
    });

    if (alocacoes.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 pt-16">Nenhum projeto encontrado para os filtros selecionados.</p>';
        return;
    }

    const dataTable = new google.visualization.DataTable();
    dataTable.addColumn({ type: 'string', id: 'Resource' });
    dataTable.addColumn({ type: 'string', id: 'Name' });
    dataTable.addColumn({ type: 'string', role: 'tooltip', p: { html: true } });
    dataTable.addColumn({ type: 'date', id: 'Start' });
    dataTable.addColumn({ type: 'date', id: 'End' });
    dataTable.addColumn({ type: 'string', role: 'style' });

    // Calcular range global (todas as alocações, sem filtro) para fixar a escala
    const todasAlocacoes = getAlocacoes();
    let globalMin = new Date();
    let globalMax = new Date();

    todasAlocacoes.forEach(a => {
        if (a.dataInicio && a.dataFim) {
            const ini = new Date(a.dataInicio + 'T00:00:00');
            const fim = new Date(a.dataFim + 'T00:00:00');
            if (ini < globalMin) globalMin = ini;
            if (fim > globalMax) globalMax = fim;
        }
    });

    // Margem de 15 dias em cada extremo para respirar
    globalMin.setDate(globalMin.getDate() - 15);
    globalMax.setDate(globalMax.getDate() + 15);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    alocacoes.forEach(aloc => {
        const prof = getProfissionais().find(p => p.id === aloc.profissionalId);
        const proj = getProjetos().find(p => p.id === aloc.projetoId);
        if (!prof || !proj || !prof.nome || !proj.nome) return;

        const inicio = new Date(aloc.dataInicio + 'T00:00:00');
        const fim    = new Date(aloc.dataFim    + 'T00:00:00');

        const tooltip = `
            <div style="padding: 10px; font-family: Arial, sans-serif;">
                <strong>${prof.nome}</strong><br/>
                <strong>Projeto:</strong> ${proj.nome}<br/>
                <strong>Período:</strong> ${formatDate(aloc.dataInicio)} - ${formatDate(aloc.dataFim)}<br/>
                <strong>Alocação:</strong> ${aloc.percentual}%<br/>
                <strong>Horas:</strong> ${aloc.horasEstimadas || 0}h estimadas / ${aloc.horasRealizadas || 0}h realizadas
            </div>
        `;

        dataTable.addRow([prof.nome, proj.nome, tooltip, inicio, fim, null]);
    });

    const options = {
        timeline: {
            showRowLabels: true,
            showBarLabels: true,
            groupByRowLabel: true,
            colorByRowLabel: false
        },
        avoidOverlappingGridLines: false,
        tooltip: { isHtml: true },
        backgroundColor: '#ffffff',
        height: Math.max(600, (alocacoes.length + 1) * 50),
        hAxis: {
            minValue: globalMin,
            maxValue: globalMax
        }
    };

    container.innerHTML = '';
    const chart = new google.visualization.Timeline(container);

    google.visualization.events.addListener(chart, 'select', function () {
        const selection = chart.getSelection();
        if (selection.length === 0) return;

        const row = selection[0].row;
        if (row === null || row === undefined) return;

        const alocacao = alocacoes[row];
        if (!alocacao) {
            console.warn('⚠️ Nenhuma alocação encontrada para a barra selecionada (row:', row, ')');
            return;
        }

        openAlocacaoModal(alocacao);
        setOpenedFromTimeline(true);
    });

    chart.draw(dataTable, options);

    // Ocultar label "undefined" da linha invisível
    function hideUndefinedLabel() {
        const svg = container.querySelector('svg');
        if (!svg) return;
        svg.querySelectorAll('text').forEach(text => {
            const content = text.textContent?.trim();
            if (!content || content === 'undefined') {
                text.textContent = '';
                text.style.visibility = 'hidden';
            }
        });
    }
    setTimeout(hideUndefinedLabel, 100);
    setTimeout(hideUndefinedLabel, 300);
    setTimeout(hideUndefinedLabel, 600);

    setTimeout(() => addTodayLineToTimeline(container, alocacoes), 500);

    console.log('📊 Timeline renderizada com', alocacoes.length, 'alocações');
}

// ===== ADICIONAR LINHA "HOJE" =====
let todayLineRetries = 0;
const MAX_RETRIES = 10;

function addTodayLineToTimeline(container, alocacoes) {
    const svg = container.querySelector('svg');
    if (!svg) {
        if (todayLineRetries < MAX_RETRIES) {
            todayLineRetries++;
            setTimeout(() => addTodayLineToTimeline(container, alocacoes), 300);
        } else {
            todayLineRetries = 0;
        }
        return;
    }
    todayLineRetries = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oldLine = svg.querySelector('.today-line');
    if (oldLine) oldLine.remove();

    const textElements = svg.querySelectorAll('text');
    const monthMap = { 'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
                       'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11 };

    const axisLabels = [];
    let lastYear = new Date().getFullYear();

    textElements.forEach(text => {
        const content = text.textContent.trim();
        const x = parseFloat(text.getAttribute('x'));
        if (isNaN(x)) return;

        if (/^\d{4}$/.test(content)) {
            lastYear = parseInt(content);
            axisLabels.push({ x, type: 'year', year: lastYear });
            return;
        }

        const monthKey = content.toLowerCase().replace('.', '').substring(0, 3);
        if (Object.prototype.hasOwnProperty.call(monthMap, monthKey)) {
            // Extrai o dia do label quando presente (ex: "jan. 4" → 4, "jan." → 1)
            const dayMatch = content.match(/(\d+)\s*$/);
            const day = dayMatch ? parseInt(dayMatch[1]) : 1;
            axisLabels.push({ x, type: 'month', month: monthMap[monthKey], day, text: content });
        }
    });

    axisLabels.sort((a, b) => a.x - b.x);

    let currentYear = new Date().getFullYear();
    axisLabels.forEach(label => {
        if (label.type === 'year') {
            currentYear = label.year;
        } else if (label.type === 'month') {
            label.year = currentYear;
            const prevMonth = axisLabels.filter(l => l.type === 'month' && l.x < label.x).pop();
            if (prevMonth && prevMonth.month > label.month) {
                label.year = prevMonth.year + 1;
                currentYear = label.year;
            }
        }
    });

    const monthLabels = axisLabels.filter(l => l.type === 'month' && l.year);

    let pixelsPerDay = null;
    let refLabel = null;

    for (let i = 0; i < monthLabels.length - 1; i++) {
        const l1 = monthLabels[i];
        const l2 = monthLabels[i + 1];
        const date1 = new Date(l1.year, l1.month, l1.day || 1);
        const date2 = new Date(l2.year, l2.month, l2.day || 1);
        const daysBetween   = (date2 - date1) / (1000 * 60 * 60 * 24);
        const pixelsBetween = l2.x - l1.x;
        if (daysBetween > 0 && pixelsBetween > 0) {
            pixelsPerDay = pixelsBetween / daysBetween;
            refLabel = l1;
            break;
        }
    }

    if (!pixelsPerDay || !refLabel) return;

    const refDate     = new Date(refLabel.year, refLabel.month, refLabel.day || 1);
    const daysFromRef = (today - refDate) / (1000 * 60 * 60 * 24);
    const xPosition   = refLabel.x + (daysFromRef * pixelsPerDay);

    const allBars = svg.querySelectorAll('rect');
    let minY = Infinity, maxY = 0;
    allBars.forEach(bar => {
        const fill   = bar.getAttribute('fill');
        const height = parseFloat(bar.getAttribute('height') || 0);
        const y      = parseFloat(bar.getAttribute('y') || 0);
        if (fill && fill !== 'none' && fill !== '#ffffff' && fill !== 'white' && height > 10 && height < 60) {
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y + height);
        }
    });
    if (minY === Infinity) { minY = 50; maxY = 400; }

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('today-line');
    g.style.pointerEvents = 'none';

    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', xPosition - 15);
    bgRect.setAttribute('y', minY);
    bgRect.setAttribute('width', '30');
    bgRect.setAttribute('height', maxY - minY);
    bgRect.setAttribute('fill', '#fee2e2');
    bgRect.setAttribute('opacity', '0.3');

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', xPosition); line.setAttribute('y1', minY);
    line.setAttribute('x2', xPosition); line.setAttribute('y2', maxY);
    line.setAttribute('stroke', '#dc2626');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('opacity', '0.8');

    const todayLabel = (() => {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        return `${dd}/${mm}/${yy}`;
    })();

    const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    labelBg.setAttribute('x', xPosition + 6); labelBg.setAttribute('y', minY + 5);
    labelBg.setAttribute('width', '62');       labelBg.setAttribute('height', '24');
    labelBg.setAttribute('fill', 'white');
    labelBg.setAttribute('stroke', '#dc2626'); labelBg.setAttribute('stroke-width', '2');
    labelBg.setAttribute('rx', '4');

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', xPosition + 37); label.setAttribute('y', minY + 22);
    label.setAttribute('fill', '#dc2626');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('text-anchor', 'middle');
    label.textContent = todayLabel;

    g.appendChild(bgRect);
    g.appendChild(line);
    g.appendChild(labelBg);
    g.appendChild(label);
    svg.appendChild(g);

    console.log('🎉 Linha "Hoje" adicionada na timeline');
}

// ===== POPULAR FILTROS =====
export function populateTimelineFilters() {
    const profSelect   = document.getElementById('timeline-filter-profissional');
    const projSelect   = document.getElementById('timeline-filter-projeto');
    const perfilSelect = document.getElementById('timeline-filter-perfil');
    const timeSelect   = document.getElementById('timeline-filter-time');
    const resetBtn     = document.getElementById('timeline-reset-filters');

    if (profSelect) {
        const ativos = [...getProfissionais()]
            .filter(p => p.ativo !== 'Não' && p.nome)
            .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
        profSelect.innerHTML = '<option value="">Todos</option>' +
            ativos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
    }

    if (projSelect) {
        const ordenados = [...getProjetos()].sort((a, b) => a.nome.localeCompare(b.nome));
        projSelect.innerHTML = '<option value="">Todos</option>' +
            ordenados.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
    }

    if (perfilSelect) {
        const perfis = [...new Set(getProfissionais()
            .filter(p => p.ativo !== 'Não')
            .map(p => p.perfil)
            .filter(pf => pf)
        )].sort();
        perfilSelect.innerHTML = '<option value="">Todos</option>' +
            perfis.map(pf => `<option value="${pf}">${pf}</option>`).join('');
    }

    if (timeSelect) {
        // Só lista times que possuem pelo menos uma alocação na timeline
        const profsComAlocacao = new Set(getAlocacoes().map(a => a.profissionalId));
        const times = [...new Set(getProfissionais()
            .filter(p => p.ativo !== 'Não' && p.time && profsComAlocacao.has(p.id))
            .map(p => p.time)
        )].sort();
        timeSelect.innerHTML = '<option value="">Todos os Times</option>' +
            times.map(t => `<option value="${t}">${t}</option>`).join('');
    }

    const redraw = () => {
        if (typeof google !== 'undefined' && google.visualization) drawTimelineChart();
    };

    [profSelect, projSelect, perfilSelect, timeSelect].forEach(select => {
        select?.addEventListener('change', redraw);
    });

    resetBtn?.addEventListener('click', () => {
        if (profSelect)   profSelect.value   = '';
        if (projSelect)   projSelect.value   = '';
        if (perfilSelect) perfilSelect.value = '';
        if (timeSelect)   timeSelect.value   = '';
        const statusSelect = document.getElementById('timeline-filter-status');
        if (statusSelect) statusSelect.value = 'Em Andamento';
        redraw();
    });

    // Listener para o filtro de status (definido no HTML com opções estáticas)
    document.getElementById('timeline-filter-status')?.addEventListener('change', redraw);
}

// ===== INICIALIZAR MÓDULO =====
export function initializeTimelineModule() {
    console.log('📈 Módulo de Timeline inicializado');

    // Expor globalmente para app.js e allocations.js chamarem
    window.drawTimelineChart = drawTimelineChart;
}

// ===== EXPORT DEFAULT =====
export default {
    drawTimelineChart,
    populateTimelineFilters,
    initializeTimelineModule
};
