// ===== CAPACITY CHART MODULE =====
// Módulo de visualização de capacidade de alocação
// Versão 4.1.0

import { getProfissionais, getAlocacoes } from '../state/app-state.js';

let capacityChart = null;

// ===== CALCULAR ALOCAÇÃO POR PROFISSIONAL =====
function calculateProfessionalCapacity(startDate, endDate, profissionalId = null) {
    const start = new Date(startDate + 'T00:00:00');
    const end   = new Date(endDate   + 'T00:00:00');

    let profissionais = getProfissionais().filter(p => p.ativo === 'Sim');
    if (profissionalId) {
        profissionais = profissionais.filter(p => p.id === profissionalId);
    }

    return profissionais.map(prof => {
        const alocacoes = getAlocacoes().filter(a => a.profissionalId === prof.id);

        let totalDays = 0;
        let totalAllocation = 0;

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const currentDate = new Date(d);
            const dow = currentDate.getDay();
            if (dow === 0 || dow === 6) continue; // ignora fins de semana

            totalDays++;

            const dayAllocation = alocacoes
                .filter(a => {
                    const alocStart = new Date(a.dataInicio + 'T00:00:00');
                    const alocEnd   = new Date(a.dataFim    + 'T00:00:00');
                    return currentDate >= alocStart && currentDate <= alocEnd;
                })
                .reduce((sum, a) => sum + (parseInt(a.percentual) || 0), 0);

            totalAllocation += dayAllocation;
        }

        const avgAllocation = totalDays > 0 ? Math.round(totalAllocation / totalDays) : 0;

        return {
            id: prof.id,
            name: prof.nome,
            allocation: avgAllocation,
            deviation: avgAllocation - 100
        };
    });
}

// ===== RENDERIZAR GRÁFICO =====
export function renderCapacityChart() {
    const periodFilter       = document.getElementById('capacity-period-filter')?.value       || 'current';
    const sortFilter         = document.getElementById('capacity-sort-filter')?.value         || 'deviation';
    const professionalFilter = document.getElementById('capacity-professional-filter')?.value || 'all';

    const today = new Date();
    let startDate, endDate;

    if (periodFilter === 'current') {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate   = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (periodFilter === 'next') {
        startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        endDate   = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    } else {
        // quarter
        startDate = new Date(today);
        endDate   = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr   = endDate.toISOString().split('T')[0];

    let data = calculateProfessionalCapacity(
        startStr,
        endStr,
        professionalFilter === 'all' ? null : professionalFilter
    );

    switch (sortFilter) {
        case 'deviation':
            data.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
            break;
        case 'name':
            data.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'overallocation':
            data.sort((a, b) => b.deviation - a.deviation);
            break;
        case 'underallocation':
            data.sort((a, b) => a.deviation - b.deviation);
            break;
    }

    const labels         = data.map(d => d.name);
    const baseAllocation = data.map(d => Math.min(d.allocation, 100));
    const overAllocation = data.map(d => Math.max(d.allocation - 100, 0));

    if (capacityChart) {
        capacityChart.destroy();
        capacityChart = null;
    }

    const ctx = document.getElementById('capacity-chart-canvas');
    if (!ctx) return;

    const wrapper = document.getElementById('capacity-chart-wrapper');
    if (wrapper) wrapper.style.height = Math.max(500, data.length * 35) + 'px';

    capacityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Alocação Base (até 100%)',
                    data: baseAllocation,
                    backgroundColor: '#3b82f6',
                    borderColor: '#2563eb',
                    borderWidth: 1,
                    barPercentage: 0.5,
                    categoryPercentage: 0.7
                },
                {
                    label: 'Superalocação (acima de 100%)',
                    data: overAllocation,
                    backgroundColor: '#ef4444',
                    borderColor: '#dc2626',
                    borderWidth: 1,
                    barPercentage: 0.5,
                    categoryPercentage: 0.7
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const i = context.dataIndex;
                            const total    = data[i].allocation;
                            const deviation = data[i].deviation;
                            const status =
                                deviation > 20  ? '🔴 Crítico - Superalocado'  :
                                deviation > 0   ? '🟠 Atenção - Superalocado'  :
                                deviation > -20 ? '🟢 Ideal'                   :
                                deviation > -40 ? '🔵 Disponível'              :
                                                  '🔵 Muito Disponível';
                            return [
                                `Alocação Total: ${total}%`,
                                `Desvio: ${deviation > 0 ? '+' : ''}${deviation}%`,
                                status
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Capacidade (%)',
                        font: { size: 14, weight: 'bold' }
                    },
                    grid: {
                        color: function (context) {
                            return context.tick.value === 100 ? '#000' : '#e5e7eb';
                        },
                        lineWidth: function (context) {
                            return context.tick.value === 100 ? 3 : 1;
                        }
                    },
                    ticks: { callback: value => value + '%' }
                },
                y: {
                    stacked: true,
                    ticks: { font: { size: 12 } }
                }
            }
        }
    });
}

// ===== POPULAR FILTRO DE PROFISSIONAIS =====
export function populateCapacityFilters() {
    const profSelect = document.getElementById('capacity-professional-filter');
    if (!profSelect) return;

    const profissionais = getProfissionais()
        .filter(p => p.ativo === 'Sim')
        .sort((a, b) => a.nome.localeCompare(b.nome));

    profSelect.innerHTML = '<option value="all">Todos os Profissionais</option>' +
        profissionais.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
}

// ===== INICIALIZAR MÓDULO =====
export function initializeCapacityChart() {
    console.log('📊 Módulo de Gráfico de Capacidade inicializado');

    document.getElementById('capacity-period-filter')?.addEventListener('change', renderCapacityChart);
    document.getElementById('capacity-sort-filter')?.addEventListener('change', renderCapacityChart);
    document.getElementById('capacity-professional-filter')?.addEventListener('change', renderCapacityChart);
}
