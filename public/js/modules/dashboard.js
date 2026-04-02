// ===== DASHBOARD MODULE =====
// Módulo de dashboard com gráficos e análises
// Extraído de app.js na refatoração v4.0.0

import { getProfissionais, getProjetos, getAlocacoes } from '../state/app-state.js';
import { formatDate } from '../core/utils.js';

// ===== VARIÁVEIS DE GRÁFICOS =====
let profileChart = null;
let monthlyAvailabilityChart = null;

// Contadores de retry para evitar loop infinito
let profileChartRetries = 0;
let monthlyChartRetries = 0;
const MAX_RETRIES = 10;

// ===== FUNÇÃO PRINCIPAL: ATUALIZAR DASHBOARD =====
export function updateDashboard() {
    console.log('📊 Atualizando dashboard...');
    
    // Atualizar gráfico de perfil
    if (typeof updateProfileChart === 'function') {
        updateProfileChart();
    }
    
    // Atualizar disponibilidade mensal
    if (typeof updateMonthlyAvailabilityChart === 'function') {
        updateMonthlyAvailabilityChart();
    }
    
    // Atualizar cards de totais
    updateDashboardTotals();
}

// ===== GRÁFICO DE PERFIL =====
export function updateProfileChart() {
    const canvas = document.getElementById('profile-distribution-chart');
    if (!canvas) return;

    // Verificar se o canvas está visível
    const isVisible = canvas.offsetWidth > 0 && canvas.offsetHeight > 0;
    if (!isVisible) {
        if (profileChartRetries < MAX_RETRIES) {
            console.log('⏳ Canvas do perfil não visível, tentando novamente...');
            profileChartRetries++;
            setTimeout(updateProfileChart, 200);
            return;
        } else {
            console.log('⚠ Canvas do perfil não ficou visível após máximo de tentativas');
            profileChartRetries = 0;
            return;
        }
    }
    
    // Reset do contador quando conseguir renderizar
    profileChartRetries = 0;

    const profiles = {};
    getProfissionais().filter(p => p.ativo !== 'Não').forEach(p => {
        profiles[p.perfil] = (profiles[p.perfil] || 0) + 1;
    });

    const labels = Object.keys(profiles);
    const data = Object.values(profiles);
    const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    if (profileChart) {
        profileChart.destroy();
        profileChart = null;
    }

    // Forçar dimensões do container antes de criar o gráfico
    const container = canvas.parentElement;
    container.style.height = '320px';
    container.style.width = '100%';

    profileChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 40,
                    bottom: 40,
                    left: 20,
                    right: 20
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    align: 'center',
                    labels: { 
                        padding: 12,
                        font: { size: 11 },
                        boxWidth: 12,
                        boxHeight: 12,
                        usePointStyle: true,
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const meta = chart.getDatasetMeta(0);
                                    const style = meta.controller.getStyle(i);
                                    return {
                                        text: label,
                                        fillStyle: style.backgroundColor,
                                        strokeStyle: style.borderColor,
                                        lineWidth: style.borderWidth,
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    },
                    maxWidth: 1000,
                    display: true
                },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 14 },
                    formatter: (value) => value,
                    anchor: 'center',
                    align: 'center' 
                }
            }
        },
        plugins: [ChartDataLabels]
    });

    console.log('✅ Gráfico de perfil renderizado');
}

// ===== GRÁFICO MENSAL DE DISPONIBILIDADE =====
export function updateMonthlyAvailabilityChart() {
    const canvas = document.getElementById('monthly-availability-chart');
    if (!canvas) return;

    // Não renderizar se o dashboard não estiver visível
    const dashboardView = document.getElementById('dashboard');
    if (!dashboardView || !dashboardView.classList.contains('active')) return;

    const monthSelector = document.getElementById('availability-month-selector');
    const profFilter = document.getElementById('availability-chart-prof-filter')?.value || '';
    const perfilFilter = document.getElementById('availability-chart-perfil-filter')?.value || '';

    if (!monthSelector) return;

    if (!monthSelector.value) {
        console.log('⚠ Mês não selecionado');
        return;
    }

    // Verificar visibilidade
    const isVisible = canvas.offsetWidth > 0 && canvas.offsetHeight > 0;
    if (!isVisible) {
        if (monthlyChartRetries < MAX_RETRIES) {
            console.log('⏳ Canvas mensal não visível, tentando novamente...');
            monthlyChartRetries++;
            setTimeout(updateMonthlyAvailabilityChart, 200);
            return;
        } else {
            console.log('⚠ Canvas mensal não ficou visível após máximo de tentativas');
            monthlyChartRetries = 0;
            return;
        }
    }
    
    monthlyChartRetries = 0;

    const [year, month] = monthSelector.value.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    let profsFiltrados = getProfissionais().filter(p => p.ativo !== 'Não');

    if (profFilter) {
        profsFiltrados = profsFiltrados.filter(p => p.id === profFilter);
    }

    if (perfilFilter) {
        profsFiltrados = profsFiltrados.filter(p => p.perfil === perfilFilter);
    }

    const dataByProf = profsFiltrados.map(prof => {
        const alocacoesProf = getAlocacoes().filter(a => a.profissionalId === prof.id);

        let totalHoras = 0;
        let current = new Date(firstDay);
        while (current <= lastDay) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                let porcentagemDia = 0;
                alocacoesProf.forEach(aloc => {
                    const inicio = new Date(aloc.dataInicio + 'T00:00:00');
                    const fim = new Date(aloc.dataFim + 'T00:00:00');
                    if (current >= inicio && current <= fim) {
                        porcentagemDia += parseInt(aloc.percentual || 0);
                    }
                });
                totalHoras += Math.min((porcentagemDia / 100) * 8, 8);
            }
            current.setDate(current.getDate() + 1);
        }

        return {
            nome: prof.nome,
            horas: Math.round(totalHoras * 10) / 10
        };
    }).filter(item => item.horas > 0);

    dataByProf.sort((a, b) => b.horas - a.horas);

    if (monthlyAvailabilityChart) {
        monthlyAvailabilityChart.destroy();
        monthlyAvailabilityChart = null;
    }

    // Ajustar altura dinamicamente: 30px por barra, mínimo 200px
    const BAR_HEIGHT = 30;
    const dynamicHeight = Math.max(200, dataByProf.length * BAR_HEIGHT);
    canvas.style.height = dynamicHeight + 'px';

    const ctx = canvas.getContext('2d');
    monthlyAvailabilityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dataByProf.map(d => d.nome),
            datasets: [{
                label: 'Horas',
                data: dataByProf.map(d => d.horas),
                backgroundColor: '#4f46e5',
                borderRadius: 4,
                barThickness: 18
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    formatter: (value) => value + 'h',
                    color: '#1f2937',
                    font: { size: 11, weight: 'bold' }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { callback: (value) => value + 'h' }
                },
                y: {
                    ticks: { font: { size: 12 } }
                }
            }
        },
        plugins: [ChartDataLabels]
    });

    console.log('✅ Gráfico mensal renderizado');
}

// ===== ATUALIZAR TOTAIS DOS CARDS =====
function updateDashboardTotals() {
    const totalProfs = getProfissionais().filter(p => p.ativo !== 'Não').length;
    const totalProjetos = getProjetos().length;
    
    // Profissionais com alocações ativas
    const today = new Date();
    const profsAlocados = new Set();
    
    getAlocacoes().forEach(aloc => {
        const start = new Date(aloc.dataInicio);
        const end = new Date(aloc.dataFim);
        if (start <= today && end >= today) {
            profsAlocados.add(aloc.profissionalId);
        }
    });
    
    const totalAlocados = profsAlocados.size;
    const totalDisponiveis = totalProfs - totalAlocados;
    
    // Atualizar DOM
    const totalProfsEl = document.querySelector('[data-metric="total-profissionais"]');
    const totalProjEl = document.querySelector('[data-metric="total-projetos"]');
    const totalAlocEl = document.querySelector('[data-metric="profissionais-alocados"]');
    const totalDispEl = document.querySelector('[data-metric="profissionais-disponiveis"]');
    
    if (totalProfsEl) totalProfsEl.textContent = totalProfs;
    if (totalProjEl) totalProjEl.textContent = totalProjetos;
    if (totalAlocEl) totalAlocEl.textContent = totalAlocados;
    if (totalDispEl) totalDispEl.textContent = totalDisponiveis;
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

    // Checkboxes de status (preserva os que estavam marcados)
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

// ===== EXPORT DEFAULT =====
export default {
    updateDashboard,
    updateProfileChart,
    updateMonthlyAvailabilityChart,
    populateDashboardFilters
};
