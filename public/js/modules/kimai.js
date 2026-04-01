// ===== KIMAI MODULE =====
// Módulo de importação de dados do Kimai
// Extraído de app.js na refatoração v4.0.0

import { getDb } from '../config/firebase-config.js';
import { getProjetos } from '../state/app-state.js';
import { showNotification, getCollectionPath } from '../core/utils.js';

// Importações Firebase
import { collection, doc, setDoc, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// ===== PROCESSAR ARQUIVO KIMAI =====
export async function processKimaiFile(file) {
    if (!file) {
        showNotification('Selecione um arquivo para importar', 'error');
        return;
    }

    try {
        const data = await readExcelFile(file);
        if (!data || data.length === 0) {
            showNotification('Arquivo vazio ou inválido', 'error');
            return;
        }

        await importKimaiData(data);
    } catch (error) {
        console.error('Erro ao processar arquivo Kimai:', error);
        showNotification('Erro ao processar arquivo', 'error');
    }
}

// ===== LER ARQUIVO EXCEL =====
async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsArrayBuffer(file);
    });
}

// ===== IMPORTAR DADOS DO KIMAI =====
async function importKimaiData(data) {
    const projetos = getProjetos();
    let importados = 0;
    let erros = 0;

    showNotification('Importando dados do Kimai...', 'info');

    for (const row of data) {
        try {
            // Extrair dados da linha
            const usuario = row['Usuário'] || row['Usuario'] || row['User'];
            const projetoNome = row['Projeto'] || row['Project'];
            const duracao = row['Duração'] || row['Duracao'] || row['Duration'];
            const data_registro = row['Data'] || row['Date'];

            if (!usuario || !projetoNome || !duracao) {
                console.warn('Linha inválida:', row);
                erros++;
                continue;
            }

            // Converter duração (formato HH:MM:SS ou HH:MM)
            const horas = parseDuration(duracao);

            // Encontrar projeto correspondente
            const projeto = findMatchingProject(projetoNome, projetos);
            if (!projeto) {
                console.warn('Projeto não encontrado:', projetoNome);
                erros++;
                continue;
            }

            // Salvar no Firestore
            const kimaiId = `${usuario}_${projeto.id}_${data_registro}`.replace(/[^a-zA-Z0-9_-]/g, '_');
            await setDoc(doc(getDb(), getCollectionPath('kimai'), kimaiId), {
                usuario,
                projetoId: projeto.id,
                projetoNome: projeto.nome,
                horas,
                data: data_registro,
                importadoEm: new Date().toISOString()
            });

            importados++;
        } catch (error) {
            console.error('Erro ao importar linha:', row, error);
            erros++;
        }
    }

    // Resultado
    if (importados > 0) {
        showNotification(
            `Importação concluída! ${importados} registros importados${erros > 0 ? `, ${erros} erros` : ''}`, 
            'success'
        );
    } else {
        showNotification('Nenhum registro foi importado', 'error');
    }

    console.log(`✅ Kimai: ${importados} importados, ${erros} erros`);
}

// ===== CONVERTER DURAÇÃO PARA HORAS =====
function parseDuration(duracao) {
    if (typeof duracao === 'number') return duracao;
    
    const parts = String(duracao).split(':');
    if (parts.length === 3) {
        // HH:MM:SS
        return parseInt(parts[0]) + parseInt(parts[1]) / 60 + parseInt(parts[2]) / 3600;
    } else if (parts.length === 2) {
        // HH:MM
        return parseInt(parts[0]) + parseInt(parts[1]) / 60;
    }
    
    return parseFloat(duracao) || 0;
}

// ===== ENCONTRAR PROJETO CORRESPONDENTE =====
function findMatchingProject(nome, projetos) {
    // Tentar match exato primeiro
    let match = projetos.find(p => p.nome.toLowerCase() === nome.toLowerCase());
    if (match) return match;

    // Tentar match parcial
    match = projetos.find(p => 
        p.nome.toLowerCase().includes(nome.toLowerCase()) ||
        nome.toLowerCase().includes(p.nome.toLowerCase())
    );
    
    return match;
}

// ===== CONFIGURAR UPLOAD =====
function setupKimaiUpload() {
    const uploadBtn = document.getElementById('kimai-upload-btn');
    const fileInput = document.getElementById('kimai-file-input');

    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                processKimaiFile(file);
                // Limpar input para permitir re-upload do mesmo arquivo
                fileInput.value = '';
            }
        });
    }
}

// ===== INICIALIZAR MÓDULO =====
export function initializeKimaiModule() {
    console.log('⏱️ Módulo de Kimai inicializado');
    
    // Verificar se SheetJS está disponível
    if (typeof XLSX === 'undefined') {
        console.warn('⚠️ SheetJS (XLSX) não carregado - importação Kimai não disponível');
        return;
    }

    // Configurar upload
    setupKimaiUpload();
}

// ===== EXPORT DEFAULT =====
export default {
    processKimaiFile,
    initializeKimaiModule
};
