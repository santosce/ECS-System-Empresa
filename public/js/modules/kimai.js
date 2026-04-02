// ===== KIMAI MODULE =====
// Módulo de importação de dados do Kimai
// Extraído de app.js na refatoração v4.0.0

import { getDb } from '../config/firebase-config.js';
import { getProjetos, getProfissionais, getAlocacoes } from '../state/app-state.js';
import { showNotification, getCollectionPath } from '../core/utils.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// ===== INICIALIZAR MÓDULO =====
export function initializeKimaiModule() {
    console.log('⏱️ Módulo de Kimai inicializado');

    if (typeof XLSX === 'undefined') {
        console.warn('⚠️ SheetJS (XLSX) não carregado - importação Kimai não disponível');
        return;
    }

    setupKimaiListeners();
}

// ===== CONFIGURAR LISTENERS =====
function setupKimaiListeners() {
    const kimaiFileInput = document.getElementById('kimai-file-input');
    const selectedFileInfo = document.getElementById('selected-file-info');
    const processKimaiBtn = document.getElementById('process-kimai-btn');
    const removeFileBtn = document.getElementById('remove-file-btn');
    let selectedFile = null;

    // Drag and drop
    const dropArea = kimaiFileInput?.parentElement?.parentElement;
    if (dropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.add('border-indigo-500', 'bg-indigo-50');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.remove('border-indigo-500', 'bg-indigo-50');
            });
        });

        dropArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) handleFileSelect(files[0]);
        });
    }

    // Seleção via input
    kimaiFileInput?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
    });

    // Remover arquivo
    removeFileBtn?.addEventListener('click', () => {
        selectedFile = null;
        if (kimaiFileInput) kimaiFileInput.value = '';
        selectedFileInfo?.classList.add('hidden');
        processKimaiBtn?.classList.add('hidden');
        clearImportResults();
    });

    // Processar importação
    processKimaiBtn?.addEventListener('click', async () => {
        if (selectedFile) await processKimaiImport(selectedFile, processKimaiBtn);
    });

    function handleFileSelect(file) {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
            showNotification('Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)', 'error');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showNotification('Arquivo muito grande! Máximo: 10MB', 'error');
            return;
        }

        selectedFile = file;
        clearImportResults();

        const fileName = document.getElementById('file-name');
        const fileSize = document.getElementById('file-size');
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = formatFileSize(file.size);

        selectedFileInfo?.classList.remove('hidden');
        processKimaiBtn?.classList.remove('hidden');
    }
}

// ===== PROCESSAR ARQUIVO KIMAI (exportada para uso externo) =====
export async function processKimaiFile(file) {
    if (!file) {
        showNotification('Selecione um arquivo para importar', 'error');
        return;
    }
    await processKimaiImport(file, null);
}

// ===== FLUXO PRINCIPAL DE IMPORTAÇÃO =====
async function processKimaiImport(file, btn) {
    try {
        showNotification('Processando arquivo...', 'info');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="loading-inline mr-2"></span>Processando...';
        }

        const excelData = await readExcelFile(file);

        if (!excelData || excelData.length === 0) {
            throw new Error('Arquivo vazio ou formato inválido');
        }

        console.log('📊 Dados lidos do Excel:', excelData.length, 'linhas');

        // 1. Parse e agrupamento (sem gravar)
        const { agrupados, errors: parseErrors } = parseKimaiData(excelData);

        // 2. Resolver alocações (sem gravar)
        const { resolvidos, errors: resolveErrors } = resolveAllocations(agrupados);

        // 3. Detectar sobreposição com dados já existentes
        const sobreposicoes = detectOverlaps(resolvidos);

        if (sobreposicoes.length > 0) {
            const confirmado = await showOverlapConfirmation(sobreposicoes);
            if (!confirmado) {
                showNotification('Importação cancelada.', 'info');
                return;
            }
        }

        // 4. Salvar no Firestore
        const result = await saveKimaiData(resolvidos, [...parseErrors, ...resolveErrors]);

        displayImportResults(result);
        showNotification(`✅ Importação concluída! ${result.updated} alocações atualizadas.`, 'success');

    } catch (error) {
        console.error('❌ Erro na importação:', error);
        showNotification('Erro ao processar arquivo: ' + error.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                Processar Importação
            `;
        }
    }
}

// ===== LER ARQUIVO EXCEL =====
function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
                    raw: false, // Converter tudo para string
                    defval: ''  // Células vazias como string vazia
                });

                console.log('📊 Registros lidos:', jsonData.length);
                console.log('📋 Primeiras colunas:', Object.keys(jsonData[0] || {}));

                resolve(jsonData);
            } catch (error) {
                reject(new Error('Erro ao ler arquivo Excel: ' + error.message));
            }
        };

        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsArrayBuffer(file);
    });
}

// ===== ETAPA 1: PARSE E AGRUPAMENTO =====
function parseKimaiData(excelData) {
    const agrupados = new Map();
    const errors = [];

    console.log('🔍 Parseando', excelData.length, 'registros...');

    for (const row of excelData) {
        const nomeProjeto = String(row['Projeto'] || '').trim();
        const nomeUsuario = String(row['Usuário'] || row['Nome'] || '').trim();
        const duracaoStr  = String(row['Duração'] || '').trim();
        const dataStr     = String(row['Data'] || '').trim();

        if (!nomeProjeto || !nomeUsuario || !duracaoStr || !dataStr) continue;

        const dataISO = parseDate(dataStr);
        if (!dataISO) {
            const msg = `⚠️ Formato de data não reconhecido: "${dataStr}"`;
            if (!errors.includes(msg)) errors.push(msg);
            continue;
        }

        const horas = parseDuration(duracaoStr);
        console.log(`📊 ${nomeUsuario} | ${nomeProjeto} | ${dataStr} | "${duracaoStr}" → ${horas}h`);

        if (horas === 0) {
            console.warn(`⚠️ Duração zero: "${duracaoStr}"`);
            continue;
        }

        const key = `${nomeUsuario}|${nomeProjeto}`;
        if (!agrupados.has(key)) {
            agrupados.set(key, { nomeUsuario, nomeProjeto, registrosPorData: new Map() });
        }

        const grupo = agrupados.get(key);
        grupo.registrosPorData.set(dataISO, (grupo.registrosPorData.get(dataISO) || 0) + horas);
    }

    console.log('✅ Agrupados:', agrupados.size, 'combinações profissional+projeto');
    return { agrupados, errors };
}

// ===== ETAPA 2: RESOLVER ALOCAÇÕES (sem gravar) =====
function resolveAllocations(agrupados) {
    // Retorna lista de entradas prontas para salvar e lista de erros
    // Cada entrada: { profissional, projeto, alocacao, registros: Map<data,horas>, total }
    const resolvidos = [];
    const errors = [];
    let processed = 0;

    console.log('📋 Projetos no sistema:', getProjetos().map(p => p.nome));
    console.log('📋 Profissionais no sistema:', getProfissionais().map(p => p.nome));

    for (const [, { nomeUsuario, nomeProjeto, registrosPorData }] of agrupados.entries()) {
        processed++;
        console.log(`🔍 Resolvendo: "${nomeUsuario}" → "${nomeProjeto}"`);

        // Profissional
        let profissional = getProfissionais().find(p =>
            p.nome.toLowerCase().trim() === nomeUsuario.toLowerCase().trim()
        );
        if (!profissional) {
            const matches = getProfissionais().filter(p =>
                p.nome.toLowerCase().includes(nomeUsuario.toLowerCase()) ||
                nomeUsuario.toLowerCase().includes(p.nome.toLowerCase())
            );
            if (matches.length > 1) {
                profissional = matches.sort((a, b) => b.nome.length - a.nome.length)[0];
                console.log(`⚠️ Múltiplos profissionais para "${nomeUsuario}", usando: "${profissional.nome}"`);
            } else if (matches.length === 1) {
                profissional = matches[0];
            }
        }
        if (!profissional) {
            errors.push(`Profissional não encontrado: ${nomeUsuario}`);
            console.warn(`❌ Profissional não encontrado: ${nomeUsuario}`);
            continue;
        }

        // Projeto
        let projeto = getProjetos().find(p =>
            p.nome.toLowerCase().trim() === nomeProjeto.toLowerCase().trim()
        );
        if (!projeto) {
            const matches = getProjetos().filter(p =>
                p.nome.toLowerCase().includes(nomeProjeto.toLowerCase()) ||
                nomeProjeto.toLowerCase().includes(p.nome.toLowerCase())
            );
            if (matches.length > 1) {
                projeto = matches.sort((a, b) => b.nome.length - a.nome.length)[0];
                console.log(`⚠️ Múltiplos projetos para "${nomeProjeto}", usando: "${projeto.nome}"`);
            } else if (matches.length === 1) {
                projeto = matches[0];
            }
        }
        if (!projeto) {
            errors.push(`Projeto não encontrado: ${nomeProjeto}`);
            console.warn(`❌ Projeto não encontrado: ${nomeProjeto}`);
            continue;
        }

        // Alocações
        const alocacoesMatch = getAlocacoes().filter(a =>
            a.profissionalId === profissional.id && a.projetoId === projeto.id
        );
        if (alocacoesMatch.length === 0) {
            errors.push(`Alocação não encontrada: ${nomeUsuario} → ${nomeProjeto}`);
            console.warn(`❌ Alocação não encontrada: ${nomeUsuario} → ${nomeProjeto}`);
            continue;
        }

        // Distribuir datas entre os períodos de alocação
        const porAlocacaoId = new Map();

        for (const [dataISO, horas] of registrosPorData.entries()) {
            let alvo = null;

            if (alocacoesMatch.length === 1) {
                alvo = alocacoesMatch[0];
            } else {
                alvo = alocacoesMatch.find(a =>
                    a.dataInicio && a.dataFim &&
                    dataISO >= a.dataInicio && dataISO <= a.dataFim
                );
                if (!alvo) {
                    errors.push(`Data ${dataISO} fora de todos os períodos de ${nomeUsuario} → ${nomeProjeto} (${horas}h ignorada)`);
                    console.warn(`⚠️ Data ${dataISO} sem período correspondente`);
                    continue;
                }
            }

            if (!porAlocacaoId.has(alvo.id)) {
                porAlocacaoId.set(alvo.id, { profissional, projeto, alocacao: alvo, registros: new Map(), total: 0 });
            }
            const entrada = porAlocacaoId.get(alvo.id);
            entrada.registros.set(dataISO, (entrada.registros.get(dataISO) || 0) + horas);
            entrada.total += horas;
        }

        resolvidos.push(...porAlocacaoId.values());
    }

    return { resolvidos, errors, processed };
}

// ===== ETAPA 3: DETECTAR SOBREPOSIÇÃO =====
function detectOverlaps(resolvidos) {
    const sobreposicoes = [];

    for (const { profissional, projeto, alocacao, registros } of resolvidos) {
        const existentes = alocacao.registrosPorData || {};
        const datasComConflito = [];

        for (const [dataISO, horasNovas] of registros.entries()) {
            const horasAntigas = existentes[dataISO];
            if (horasAntigas !== undefined && horasAntigas > 0) {
                datasComConflito.push({ data: dataISO, horasAntigas, horasNovas });
            }
        }

        if (datasComConflito.length > 0) {
            sobreposicoes.push({
                profissional: profissional.nome,
                projeto: projeto.nome,
                periodo: alocacao.dataInicio && alocacao.dataFim
                    ? `${alocacao.dataInicio} – ${alocacao.dataFim}`
                    : null,
                datas: datasComConflito.sort((a, b) => a.data.localeCompare(b.data))
            });
        }
    }

    return sobreposicoes;
}

// ===== ETAPA 3b: CONFIRMAÇÃO DE SOBREPOSIÇÃO =====
function showOverlapConfirmation(sobreposicoes) {
    return new Promise((resolve) => {
        // Remove modal anterior se existir
        document.getElementById('kimai-overlap-modal')?.remove();

        const totalDatas = sobreposicoes.reduce((acc, s) => acc + s.datas.length, 0);

        const linhas = sobreposicoes.map(s => `
            <div class="mb-4">
                <p class="font-semibold text-gray-800">${s.profissional} → ${s.projeto}</p>
                ${s.periodo ? `<p class="text-xs text-gray-500 mb-1">Período: ${s.periodo}</p>` : ''}
                <ul class="mt-1 space-y-1 max-h-40 overflow-y-auto">
                    ${s.datas.map(d => `
                        <li class="text-sm text-gray-600 flex gap-3">
                            <span class="w-28 shrink-0">${d.data}</span>
                            <span class="text-red-500 line-through">${d.horasAntigas}h</span>
                            <span>→</span>
                            <span class="text-indigo-600 font-medium">${d.horasNovas.toFixed(2)}h</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `).join('<hr class="my-3 border-gray-200">');

        const modal = document.createElement('div');
        modal.id = 'kimai-overlap-modal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                <div class="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
                    <h3 class="text-lg font-bold text-yellow-800">⚠️ Dados já existentes</h3>
                    <p class="text-sm text-yellow-700 mt-1">
                        ${totalDatas} data(s) em ${sobreposicoes.length} alocação(ões) já possuem horas registradas e serão sobrescritas.
                    </p>
                </div>
                <div class="px-6 py-4 max-h-80 overflow-y-auto">
                    ${linhas}
                </div>
                <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button id="kimai-overlap-cancel"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button id="kimai-overlap-confirm"
                        class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                        Sobrescrever e importar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('kimai-overlap-confirm').addEventListener('click', () => {
            modal.remove();
            resolve(true);
        });
        document.getElementById('kimai-overlap-cancel').addEventListener('click', () => {
            modal.remove();
            resolve(false);
        });
    });
}

// ===== ETAPA 4: SALVAR NO FIRESTORE =====
async function saveKimaiData(resolvidos, errors) {
    const result = {
        processed: resolvidos.length,
        updated: 0,
        skipped: 0,
        errors: [...errors],
        details: []
    };

    for (const { profissional, projeto, alocacao, registros, total } of resolvidos) {
        try {
            const registrosNovos = Object.fromEntries(registros);
            const novoTotal = Math.round(total);

            console.log(`💾 Salvando: ${profissional.nome} → ${projeto.nome} [${alocacao.dataInicio}–${alocacao.dataFim}]: ${alocacao.horasRealizadas || 0}h → ${novoTotal}h`);

            await setDoc(doc(getDb(), getCollectionPath('alocacoes'), alocacao.id), {
                ...alocacao,
                horasRealizadas: novoTotal,
                registrosPorData: registrosNovos,
                ultimaImportacao: new Date().toISOString()
            });

            result.updated++;
            result.details.push({
                profissional: profissional.nome,
                projeto: projeto.nome,
                periodo: alocacao.dataInicio && alocacao.dataFim
                    ? `${alocacao.dataInicio} – ${alocacao.dataFim}`
                    : null,
                horasAntes: alocacao.horasRealizadas || 0,
                horasDepois: novoTotal,
                diferenca: novoTotal - (alocacao.horasRealizadas || 0)
            });

            console.log(`✅ Atualizado: ${profissional.nome} → ${projeto.nome}: ${alocacao.horasRealizadas || 0}h → ${novoTotal}h`);

        } catch (error) {
            result.skipped++;
            result.errors.push(`Erro ao atualizar ${profissional.nome} → ${projeto.nome}: ${error.message}`);
            console.error('❌ Erro:', error);
        }
    }

    return result;
}

// ===== PARSE DE DATA (v3.0 - Robusta) =====
function parseDate(dateStr) {
    dateStr = String(dateStr).trim();

    // Serial do Excel (ex: 45733)
    if (/^\d{4,5}$/.test(dateStr)) {
        try {
            const jsTimestamp = (parseInt(dateStr, 10) - 25569) * 86400 * 1000;
            const date = new Date(jsTimestamp);
            const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
            if (!isNaN(utcDate.getTime())) return utcDate.toISOString().split('T')[0];
        } catch (e) { /* continua */ }
    }

    // YYYY-MM-DD
    let match = dateStr.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})$/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;

    // DD/MM/YYYY ou DD.MM.YYYY (BR/alemão)
    match = dateStr.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/);
    if (match) {
        if (parseInt(match[1], 10) > 12) return `${match[3]}-${match[2]}-${match[1]}`;
        return `${match[3]}-${match[2]}-${match[1]}`; // assumir BR
    }

    // Último recurso: deixar o JS tentar
    try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
    } catch (e) { /* ignorar */ }

    console.warn('Formato de data não reconhecido:', dateStr);
    return null;
}

// ===== PARSE DE DURAÇÃO =====
function parseDuration(durationStr) {
    durationStr = String(durationStr).trim();

    // Formato "X days HH:MM:SS"
    if (durationStr.includes('days') || durationStr.includes('day')) {
        const partes = durationStr.split(/days?/i);
        const dias = parseInt(partes[0].trim()) || 0;
        const timeParts = partes[1].trim().split(':').map(p => parseInt(p) || 0);
        const totalHoras = (dias * 24) + timeParts[0] + (timeParts[1] / 60) + ((timeParts[2] || 0) / 3600);
        console.log(`🔍 Convertendo: "${durationStr}" → ${totalHoras.toFixed(2)}h`);
        return Math.round(totalHoras * 100) / 100;
    }

    // Formato HH:MM ou HH:MM:SS
    if (durationStr.includes(':')) {
        const parts = durationStr.split(':').map(p => parseInt(p) || 0);
        return parts[0] + (parts[1] / 60) + ((parts[2] || 0) / 3600);
    }

    // Decimal
    const num = parseFloat(durationStr.replace(',', '.'));
    if (!isNaN(num)) return num < 24 ? num : num / 60;

    return 0;
}

// ===== EXIBIÇÃO DE RESULTADOS =====
function displayImportResults(result) {
    const importResults = document.getElementById('import-results');
    const importSummary = document.getElementById('import-summary');

    if (!importResults || !importSummary) return;

    let html = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-sm text-blue-600 font-medium">Processadas</p>
                <p class="text-2xl font-bold text-blue-900">${result.processed}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
                <p class="text-sm text-green-600 font-medium">Atualizadas</p>
                <p class="text-2xl font-bold text-green-900">${result.updated}</p>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg">
                <p class="text-sm text-yellow-600 font-medium">Ignoradas</p>
                <p class="text-2xl font-bold text-yellow-900">${result.skipped}</p>
            </div>
        </div>
    `;

    if (result.details.length > 0) {
        html += `
            <div class="mb-6">
                <h4 class="font-semibold text-gray-800 mb-3">📋 Detalhes das Atualizações:</h4>
                <div class="space-y-3">
                    ${result.details.map(d => {
                        const diferenca = d.diferenca || 0;
                        const sinal = diferenca > 0 ? '+' : '';
                        const cor = diferenca > 0 ? 'text-green-600' : diferenca < 0 ? 'text-red-600' : 'text-gray-600';
                        return `
                            <div class="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                <p class="font-semibold text-gray-900 mb-2">${d.profissional} → ${d.projeto}</p>
                                ${d.periodo ? `<p class="text-xs text-gray-500 mb-1">Período: ${d.periodo}</p>` : ''}
                                <div class="flex gap-4 text-sm">
                                    <span class="text-gray-600">Antes: <strong>${d.horasAntes}h</strong></span>
                                    <span class="${cor} font-bold">${sinal}${diferenca}h</span>
                                    <span class="text-indigo-600">Depois: <strong>${d.horasDepois}h</strong></span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    if (result.errors.length > 0) {
        const maxVisivel = 10;
        const temMais = result.errors.length > maxVisivel;

        html += `
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg mt-6">
                <h4 class="font-semibold text-yellow-800 mb-2">⚠️ Avisos (${result.errors.length}):</h4>
                <ul id="import-errors-list" class="list-disc list-inside text-sm text-yellow-700 space-y-1 ${temMais ? 'max-h-64 overflow-y-auto' : ''}">
                    ${result.errors.slice(0, maxVisivel).map(err => `<li>${err}</li>`).join('')}
                </ul>
                ${temMais ? `
                    <div id="import-errors-hidden" class="hidden">
                        <ul class="list-disc list-inside text-sm text-yellow-700 space-y-1 max-h-96 overflow-y-auto">
                            ${result.errors.map(err => `<li>${err}</li>`).join('')}
                        </ul>
                    </div>
                    <button id="toggle-errors-btn" onclick="
                        const lista = document.getElementById('import-errors-list');
                        const hidden = document.getElementById('import-errors-hidden');
                        const btn = document.getElementById('toggle-errors-btn');
                        if (hidden.classList.contains('hidden')) {
                            lista.classList.add('hidden');
                            hidden.classList.remove('hidden');
                            btn.textContent = '▲ Mostrar menos';
                        } else {
                            lista.classList.remove('hidden');
                            hidden.classList.add('hidden');
                            btn.textContent = '▼ Ver todos os ${result.errors.length} avisos';
                        }
                    " class="mt-3 text-sm text-yellow-800 hover:text-yellow-900 font-semibold underline cursor-pointer">
                        ▼ Ver todos os ${result.errors.length} avisos
                    </button>
                ` : ''}
            </div>
        `;
    }

    importSummary.innerHTML = html;
    importResults.classList.remove('hidden');

    setTimeout(() => {
        importResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// ===== UTILITÁRIOS =====
function clearImportResults() {
    const importResults = document.getElementById('import-results');
    const importSummary = document.getElementById('import-summary');
    if (importSummary) importSummary.innerHTML = '';
    importResults?.classList.add('hidden');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
