const {db, admin} = require('../config/firebase')
const { decryptObj } = require('../controller/functions');

const operatorSocket = (socket, io) => {
    console.log('Initializing OPERATOR Firestore listeners...');
    let collectionUnsubscribe = null;
    const permissionUnsubscribe = getPermissions((perm) => {
        const permissionRecords = {
            data: perm
        }
        // console.log('permission data: ',perm)

        const status = perm?.permission
            ? ['Drafting', 'In Review', 'Returned|3', 'Returned|4']
            : ['In Review', 'Returned|3'];

        if (collectionUnsubscribe) {
            console.log('Updating Firestore collection listener...');
            collectionUnsubscribe();
        }
        collectionUnsubscribe = setupCollections(socket, io, status, permissionRecords);

    })
    

    socket.on('disconnect', () => {
        console.log('Client disconnected, removing Firestore listener.');
        permissionUnsubscribe();
        if (collectionUnsubscribe) {
            collectionUnsubscribe();
        }
    })

}

const setupCollections = (socket, io, status, permissionRecords) =>{
    const keysNotToDecrypt = ['status', 'DV', 'DVKey', 'template', 'origNumber', 'iv', 'submittedBy']
    const collectionRef = db.collection('records').where('status', 'in', status);
    const unsubscribe = collectionRef.onSnapshot( (snapshot) => {
        console.log('operator documents found');
        const updatedDocuments = snapshot.docs.reduce((acc, doc) => {
            const encryptedData = doc.data();
            const decryptedData = decryptObj(encryptedData, { keysNotToDecrypt });
            acc[doc.id] = {data: decryptedData};
            return acc;
        }, {});

        const doc = {
            documents: updatedDocuments
        }

        io.emit('operator:firestore:update', doc);
        io.emit('operatorPermission:firestore:update', permissionRecords)
    },
    (err) => {
        console.error('Error in operator Firestore listener:', err);
    });
    return unsubscribe
}

const getPermissions = (callback) => {
    const docRef = db.collection('Roles').doc('Funding');
    const unsubscribe = docRef.onSnapshot(
        (doc) => {
            if (doc.exists) {
                callback(doc.data());
            } else {
                console.error('No document found for Funding');
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

module.exports = operatorSocket