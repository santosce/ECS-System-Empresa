// Mock de firebase-config.js para testes
export function getDb()            { return {}; }
export function getAuthInstance()  { return { currentUser: { uid: 'test-user' } }; }
export function getProvider()      { return {}; }
export function getAppId()         { return 'test-app'; }
export function initializeFirebase() { return Promise.resolve(); }
export function signInWithPopup()  { return Promise.resolve(); }
export function signOut()          { return Promise.resolve(); }
export function onAuthStateChanged() {}
export function collection(db, path) { return { _path: path }; }
export function onSnapshot()       { return () => {}; }
export function addDoc()           { return Promise.resolve({ id: 'new-doc-id' }); }
export function doc(db, col, id)   { return { _col: col, _id: id }; }
export function setDoc()           { return Promise.resolve(); }
export function deleteDoc()        { return Promise.resolve(); }
export function getDoc()           { return Promise.resolve({ exists: () => false, data: () => ({}) }); }
export function getDocs()          { return Promise.resolve({ docs: [] }); }
