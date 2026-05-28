const DB_NAME = 'RedactaDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

/**
 * Initializes the IndexedDB database.
 */
export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
};

/**
 * Retrieves all stored projects.
 * @returns {Promise<Array>}
 */
export const getAllProjects = () => {
    return initDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();
            
            request.onsuccess = () => {
                const projects = request.result || [];
                projects.sort((a, b) => b.updatedAt - a.updatedAt);
                resolve(projects);
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    });
};

/**
 * Saves or updates a project.
 * @param {Object} project 
 * @returns {Promise<void>}
 */
export const saveProject = (project) => {
    return initDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(project);
            
            request.onsuccess = () => {
                resolve();
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    });
};

/**
 * Deletes a project by ID.
 * @param {string} id 
 * @returns {Promise<void>}
 */
export const deleteProject = (id) => {
    return initDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                resolve();
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    });
};
