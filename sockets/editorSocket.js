const {db} = require('../config/firebase')
const { decryptObj } = require('../controller/functions');

const editorSocket = (socket, io) => {
    console.log('Initializing EDITOR Firestore listeners...');
    let collectionUnsubscribe = null;
    const permissionUnsubscribe = getPermissions((perm) => {
        const permissionRecords = {
            data: perm
        }
        console.log('permission data: ',perm)

        const status = perm?.permission
            ? ['Drafting', 'Returned|4', 'In Review', 'Returned|3']
            : ['Drafting', 'Returned|4'];

        if (collectionUnsubscribe) {
            console.log('Updating Firestore collection listener...');
            collectionUnsubscribe();
        }
        collectionUnsubscribe = setupCollections(socket, io, status, permissionRecords);

    })
    
    const PAGE_SIZE = 20;
    let unsubscribeRecord = null;
    let lastVisible = null;

    const fetchDocuments = () => {
        const collectionRef = db.collection('records');
        const keysNotToDecrypt = ['status', 'DV', 'DVKey', 'template', 'origNumber', 'iv', 'submittedBy']
        let query = collectionRef.orderBy('createdAt', 'desc').limit(PAGE_SIZE);
        if (lastVisible) {
            query = query.startAfter(lastVisible);
        }
    
        unsubscribeRecord = query.onSnapshot(
            (snapshot) => {
                if (!snapshot.empty) {
                    lastVisible = snapshot.docs[snapshot.docs.length - 1];
    
                    const updatedDocuments = snapshot.docs.reduce((acc, doc) => {
                        const encryptedData = doc.data();
                        const decryptedData = decryptObj(encryptedData, { keysNotToDecrypt });
                        acc[doc.id] = { data: decryptedData };
                        return acc;
                    }, {});
    
                    io.emit('editor:firestore:records', updatedDocuments);
                    setTimeout(fetchDocuments, 1000);
                } else {
                    console.log('No more documents to fetch.');
                }
            },
            (err) => {
                console.error('Error in Firestore real-time listener:', err);
            }
        );
    
    }

    fetchDocuments();

    socket.on('disconnect', () => {
        console.log('Client disconnected, removing Firestore listener.');
        permissionUnsubscribe();
        if (collectionUnsubscribe) {
            collectionUnsubscribe();
        }
        if(unsubscribeRecord){
            unsubscribeRecord();
        }
    })
    
}

const setupCollections = (socket, io, status, permissionRecords) =>{
    const keysNotToDecrypt = ['status', 'DV', 'DVKey', 'template', 'origNumber', 'iv', 'submittedBy']
    const collectionRef = db.collection('records').where('status', 'in', status);
    const unsubscribe = collectionRef.onSnapshot( (snapshot) => {
        console.log('editor documents found');
        const updatedDocuments = snapshot.docs.reduce((acc, doc) => {
            const encryptedData = doc.data();
            const decryptedData = decryptObj(encryptedData, { keysNotToDecrypt });
            acc[doc.id] = decryptedData;
            return acc;
        }, {});

        io.emit('editor:firestore:update', updatedDocuments);
        io.emit('editorPermission:firestore:update', permissionRecords)
    },
    (err) => {
        console.error('Error in editor Firestore listener:', err);
    });
    return unsubscribe
}


const getPermissions = (callback) => {
    const docRef = db.collection('Roles').doc('Preparer');
    const unsubscribe = docRef.onSnapshot(
        (doc) => {
            if (doc.exists) {
                callback(doc.data());
            } else {
                console.error('No document found for Editor');
                callback(null);
            }
        },
        (error) => {
            console.error('Error listening to document updates:', error);
            callback(null);
        }
    );

    return unsubscribe;
};

module.exports = editorSocket