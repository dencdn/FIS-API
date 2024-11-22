const {admin, db, rtdb}  = require('../../config/firebase');

const addComments = async(DV, comment) => {
    try {
        const docref = db.collection('records').doc(DV)
        await docref.update({
            comments: admin.firestore.FieldValue.arrayUnion(comment)
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

const updateUserAcc = async(uid, role, dispName) => {
    try {
        console.log('update', uid, role, dispName)
        await admin.auth().setCustomUserClaims(uid, { role, dispName });
        await db.collection('listOfUsers').doc(uid).update({name: dispName})
        const user = await admin.auth().getUser(uid);
        return user.toJSON()
    } catch (error) {
        console.log('Error updating account', error)
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

module.exports = {
    addComments,
    setNotification,
    setHistoryLogs,
    updateUserAcc,
    getUsers
}