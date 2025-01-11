const {db, admin} = require('../config/firebase')
const { decryptObj } = require('../controller/functions');

const adminSocket = (socket, io) => {
    console.log('Initializing ADMIN Firestore listeners...');
    const status = ['Approved', 'For Approval']
    const keysNotToDecrypt = ['status', 'DV', 'DVKey', 'template', 'origNumber', 'iv', 'submittedBy']
    const collectionRef = db.collection('records').where('status', 'in', status);
    collectionRef.onSnapshot( (snapshot) => {
        console.log('admin documents found');
        const updatedDocuments = snapshot.docs.reduce((acc, doc) => {
            const encryptedData = doc.data();
            const decryptedData = decryptObj(encryptedData, { keysNotToDecrypt });
            acc[doc.id] = {data: decryptedData};
            return acc;
        }, {});
        io.emit('admin:firestore:update', updatedDocuments);
    },
    (err) => {
        console.error('Error in editor Firestore listener:', err);
    })

}

module.exports = adminSocket