// Mock do firebase-firestore para testes
export function collection(db, path) { return { _path: path }; }
export function addDoc(ref, data)    { return Promise.resolve({ id: 'new-id' }); }
export function setDoc(ref, data)    { return Promise.resolve(); }
export function deleteDoc(ref) {
    window.__testDeleteDocCalled = true;
    return Promise.resolve();
}
export function doc(db, col, id)     { return { _col: col, _id: id }; }
export function getDoc()             { return Promise.resolve({ exists: () => false, data: () => ({}) }); }
export function getDocs()            { return Promise.resolve({ docs: [] }); }
export function onSnapshot()         { return () => {}; }
