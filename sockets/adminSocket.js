const { db } = require('../config/firebase');
const { decryptObj } = require('../controller/functions');

const adminSocket = (socket, io) => {
    console.log('Initializing ADMIN Firestore listeners...');
    const keysNotToDecrypt = ['status', 'DV', 'DVKey', 'template', 'origNumber', 'iv', 'submittedBy'];
    const collectionRef = db.collection('records');

    const PAGE_SIZE = 10;
    let unsubscribe = null;
    let lastVisible = null;

    // Real-time listener with pagination
    const fetchDocuments = () => {
        let query = collectionRef.orderBy('createdAt', 'desc').limit(PAGE_SIZE);
        if (lastVisible) {
            query = query.startAfter(lastVisible);
        }

        unsubscribe = query.onSnapshot(
            (snapshot) => {
                if (!snapshot.empty) {
                    lastVisible = snapshot.docs[snapshot.docs.length - 1];

                    const updatedDocuments = snapshot.docs.reduce((acc, doc) => {
                        const encryptedData = doc.data();
                        const decryptedData = decryptObj(encryptedData, { keysNotToDecrypt });
                        acc[doc.id] = { data: decryptedData };
                        return acc;
                    }, {});

                    io.emit('admin:firestore:update', updatedDocuments);
                    setTimeout(fetchDocuments, 1000);
                } else {
                    console.log('No more documents to fetch.');
                }
            },
            (err) => {
                console.error('Error in Firestore real-time listener:', err);
            }
        );
    };

    fetchDocuments();

    socket.on('disconnect', () => {
        console.log('Admin socket disconnected.');
        if (unsubscribe) {
            unsubscribe();
        }
    });
};

module.exports = adminSocket;
