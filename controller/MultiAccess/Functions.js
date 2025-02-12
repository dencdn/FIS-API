const {admin, db, rtdb}  = require('../../config/firebase');
const { encryptObj } = require('../functions');

const addComments = async(DV, comment) => {
    try {
        const docref = db.collection('records').doc(DV)
        const encryptedComment = encryptObj(comment, {allKeys: true})
        await docref.update({
            comments: admin.firestore.FieldValue.arrayUnion(encryptedComment)
        })
    } catch (error) {
       console.log('Error adding comment: ', error) 
    }
}

const setNotification = async (destination_uids, dataCollection, notifMessage1, notifMessage2, DV) => {
    
    try{
     for (const destination_uid of destination_uids){
         const notificationRef = rtdb.ref(`users/${destination_uid}/notifications`);
         await notificationRef.push({
             message1: notifMessage1,
             message2: notifMessage2,
             data: `${dataCollection}|${DV}`,
             read: false,
         });
     }
    }catch(error){
     console.log('error in setNotif:', error)
    }
 }

 const setHistoryLogs = async(DT, logs) => {
    try {
        const docref = db.collection('passed_records').doc('History_Logs')
        docref.set({
            [DT]: logs
        }, {merge: true})

        const historyLogs = await docref.get()
        return historyLogs.data();

    }catch(error){
        console.error("Error History Logs: ", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

const getUsers = async (role) => {
    try{
        const docref = await db.collection('listOfUsers').get()

        const uids = []

        docref.forEach(doc => {
            const data = doc.data()

            if(data.role === role && data.uid){
                uids.push(data.uid)
            }
        })

        return uids;

    }catch(error){
        console.log(`Error in getting list of users : ${error}`)
    }
    return [];
}

const getDateTime = () => {
    const today = new Date()
    const dateCollection = today.toLocaleDateString("en-PH", {
        timeZone: 'Asia/Manila',
        year: "numeric",
        month: "long",
        day: "2-digit"
      });

    const timeCollection = today.toLocaleTimeString("en-PH", {
        timeZone: 'Asia/Manila',
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });

    return `${dateCollection} ${timeCollection}`;
}

module.exports = {
    addComments,
    setNotification,
    setHistoryLogs,
    getUsers,
    getDateTime
}