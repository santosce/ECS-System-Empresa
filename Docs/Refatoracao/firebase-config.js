// ===== FIREBASE CONFIG MODULE =====
// Módulo de configuração e inicialização do Firebase
// Extraído de app.js na refatoração v4.0.0

// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    addDoc, 
    doc, 
    setDoc, 
    deleteDoc, 
    getDoc, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ===== VARIÁVEIS GLOBAIS DO FIREBASE =====
let app = null;
let db = null;
let auth = null;
let provider = null;
let appId = null;

// ===== FUNÇÃO DE INICIALIZAÇÃO =====
async function initializeFirebase() {
    try {
        console.log('%cFirebase: Iniciando configuração...', 'color: #6b7280;');
        
        const response = await fetch('/__/firebase/init.json');
        if (!response.ok) throw new Error('Falha ao carregar configuração do Firebase');
        
        const firebaseConfig = await response.json();
        appId = firebaseConfig.projectId;
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        provider = new GoogleAuthProvider();

        console.log('%c✓ Firebase inicializado com sucesso', 'color: #10b981;');
        return true;
    } catch (error) {
        console.error("Falha ao inicializar o Firebase:", error);
        throw error;
    }
}

// ===== EXPORTS =====
export {
    // Funções
    initializeFirebase,
    
    // Instâncias Firebase
    app,
    db,
    auth,
    provider,
    appId,
    
    // Re-exports das funções Firebase (para facilitar imports)
    initializeApp,
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    getFirestore,
    collection,
    onSnapshot,
    addDoc,
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    getDocs
};

// ===== GETTERS PARA VARIÁVEIS GLOBAIS =====
// Como as variáveis são inicializadas depois, precisamos de getters
export function getApp() {
    return app;
}

export function getDb() {
    if (!db) throw new Error('Firebase não inicializado. Chame initializeFirebase() primeiro.');
    return db;
}

export function getAuthInstance() {
    if (!auth) throw new Error('Firebase não inicializado. Chame initializeFirebase() primeiro.');
    return auth;
}

export function getProvider() {
    if (!provider) throw new Error('Firebase não inicializado. Chame initializeFirebase() primeiro.');
    return provider;
}

export function getAppId() {
    if (!appId) throw new Error('Firebase não inicializado. Chame initializeFirebase() primeiro.');
    return appId;
}
