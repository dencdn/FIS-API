const {admin, db, rtdb}  = require('../config/firebase')

const { 
    addComments,
    setNotification,
    setHistoryLogs } = require('./MultiAccess/Functions')

const returnRecordTo = async(req, res) => {
    const {DV, payee, returnTo, remarks} = req.body;
    const dispName = req.user.name;
    const today = new Date()
    const dateCollection = today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit"
    });
    const timeCollection = today.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
    });
    const notifMessage1 = "The Disbursement Voucher for"
    const notifMessage2 = "has been returned by"
    const dataCollection = `${dateCollection}|${timeCollection}|${payee}|${dispName}`
    const dateTimePassed = `${dateCollection}|${timeCollection}`;
    const returnedBy = `${dispName}|${dateTimePassed}`
    const comment = {dispName, remarks, dateTimePassed}
    const logs = `${payee}!${DV}!Returned By ${dispName}!${dateTimePassed}`
    
    try{
        const updatedDocu = await updateStatus(DV, returnedBy, returnTo)
        const returnData = {
            [DV] : updatedDocu
        }
        const listOfAcc = await getListOfAccount(returnTo);
        await setNotification(listOfAcc, dataCollection, notifMessage1, notifMessage2, DV)
        if(remarks) {
            await addComments(DV, comment)
        }
        await setHistoryLogs(dateTimePassed, logs)

        res.status(200).json({success: true, update: returnData});

    }catch(error){
        console.log(`Error retrieving passed records: ${error}`);
        res.status(500).json({ message: "Internal Error" });
    }
}

const updateStatus = async (DV, dTPassed, returnToRole) => {
    try{
        const returnType = `Returned|${returnToRole}`
        const docref = db.collection('records').doc(DV)
        if(returnToRole === '4') {
            await docref.update({
                returnedToPreparer: dTPassed,
                status: returnType
            })
        } else {
            await docref.update({
                returnedToFunding: dTPassed,
                status: returnType
            })
        }
        const updatedDoc = await docref.get()
        return updatedDoc.data();
    }catch(error){
        console.log("error in updating", error)
    }
}

const updateStatusToApproved = async(DV, DTpass) => {
    try {
        const docref = db.collection('records').doc(DV)
        await docref.update({
            reviewedBy: DTpass,
            status: 'For Approval'
        })
        const updatedDoc = await docref.get()
        return updatedDoc.data();
    } catch (error) {
        console.log("error in updating", error)
    }
}

const getListOfAccount = async (listNumber) => {
    try{

        const docref = await db.collection('listOfUsers').get()

        const uids = []

        docref.forEach(doc => {
            const data = doc.data()

            if(data.role === listNumber && data.uid){
                uids.push(data.uid)
            }
        })
    
        return uids;

    }catch(error){
        console.log(`Error in getting list of op : ${error}`)
    }
    return [];
}

const transferDocument = async (req, res) => {
    const {DV, payee, remarks} = req.body;
    const dispName = req.user.name;
    const uid = req.user.uid;
    const today = new Date()
    const dateCollection = today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit"
      });
    const timeCollection = today.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
    const notifMessage1 = "The Disbursement Voucher for"
    const notifMessage2 = "has been passed by"
    const dataCollection = `${dateCollection}|${timeCollection}|${payee}|${dispName}`
    const dateTimePassed = `${dateCollection}|${timeCollection}`;
    const reviewedBy = `${dispName}|${dateTimePassed}`
    const comment = {dispName, remarks, dateTimePassed}
    const logs = `${payee}!${DV}!Reviewed By ${dispName}!${dateTimePassed}`

    try {
        const updatedDocu = await updateStatusToApproved(DV, reviewedBy)
        const returnData = {
            [DV] : updatedDocu
        }
        const listOfApproverAcc = await getListOfAccount('1');
        await setNotification(listOfApproverAcc, dataCollection, notifMessage1, notifMessage2, DV)
        if(remarks) {
            await addComments(DV, comment)
        }
        await setHistoryLogs(dateTimePassed, logs)

        //res.status(200).json({success: true, record: data, update: returnData});
        res.status(200).json({success: true, update: returnData});
    }catch(error){
        console.log('error creating passed records: ', error)
        res.status(500).json({success: false, message: `error creating passed records: ${error}`});
    }
}

const getPermission = async(req, res) => {
    try {
        const docref = await db.collection('Roles').doc('Budget Officer').get()
        if(docref.exists){
            const data = docref.data()
            res.status(200).json({data: data})
        }
    }catch(error){
        console.log(`Error retrieving Preparer Permision ${error}`)
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = { 
    returnRecordTo, 
    transferDocument,
    getPermission
}