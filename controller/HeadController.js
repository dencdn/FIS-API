const {admin, db, rtdb}  = require('../config/firebase')

const { 
    addComments,
    setNotification,
    setHistoryLogs,
    getDateTime,
    getUsers } = require('./MultiAccess/Functions')

const returnRecordTo = async(req, res) => {
    const {DV, payee, returnTo, remarks} = req.body;
    const dispName = req.user.name;
    
    const dateTimeCollection = getDateTime();
    const notifMessage1 = "The Disbursement Voucher for"
    const notifMessage2 = "has been returned by"
    const dataCollection = `${dateTimeCollection}|${payee}|${dispName}`
    const returnedBy = `${dispName}|${dateTimeCollection}`
    const comment = {dispName, remarks, dateTimeCollection}
    const logs = `${payee}!${DV}!Returned By ${dispName}!${dateTimeCollection}!Returned`
    
    try{
        const updatedDocu = await updateStatus(DV, returnedBy, returnTo)
        const listOfAcc = await getUsers(returnTo);
        await setNotification(listOfAcc, dataCollection, notifMessage1, notifMessage2, DV)
        if(remarks) {
            await addComments(DV, comment)
        }
        await setHistoryLogs(dateTimeCollection, logs)

        res.status(200).json({message: 'Disbursement Voucher has been returned'});

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

const transferDocument = async (req, res) => {
    const {DV, payee, remarks} = req.body;
    const dispName = req.user.name;
    const uid = req.user.uid;

    const dateTimeCollection = getDateTime();
    const notifMessage1 = "The Disbursement Voucher for"
    const notifMessage2 = "has been passed by"
    const dataCollection = `${dateTimeCollection}|${payee}|${dispName}`
    const reviewedBy = `${dispName}|${dateTimeCollection}`
    const comment = {dispName, remarks, dateTimeCollection}
    const logs = `${payee}!${DV}!Reviewed By ${dispName}!${dateTimeCollection}!For Approval`

    try {
        await updateStatusToApproved(DV, reviewedBy)
        const listOfApproverAcc = await getUsers('1');
        await setNotification(listOfApproverAcc, dataCollection, notifMessage1, notifMessage2, DV)
        if(remarks) {
            await addComments(DV, comment)
        }
        await setHistoryLogs(dateTimeCollection, logs)

        res.status(200).json({message: 'Disbursement Voucher has been transfer'});
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