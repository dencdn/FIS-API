const {admin, db, rtdb}  = require('../config/firebase')
const { google } = require('googleapis');
const sheets = google.sheets('v4');

const { 
    addComments,
    setNotification,
    setHistoryLogs,
    getDateTime ,
    getUsers
} = require('./MultiAccess/Functions');
const { messaging } = require('firebase-admin');
const { parse } = require('dotenv');

const updateASAORS = async (req, res) => {
    try{
        console.log(req.body)
        const newlyASA = req.body.update
        const previousASA_test = req.body.previousASA
        const {id} = req.params
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1


        //handle control books new amount per control book
        // const ASA_amount = req.body.controlBooks
        // batch_HandleControlBook

        const asa_test = req.body.data.asa
        const {obj1: asa, obj2: previousASA} = theDifference(asa_test, previousASA_test, newlyASA)
        console.log(`asa:`, asa)
        console.log(`previousASA: `, previousASA)
        const ASA_amount = Object.entries(asa).reduce((acc, [key, value]) => {
            const newKey = key.split('/')[0];
            acc[newKey] = (acc[newKey] || 0) + value;
            return acc
        }, {})
        console.log(Boolean(previousASA))
        if(((!asa || Object.keys(asa).length === 0) && (!previousASA || Object.keys(previousASA).length === 0)) && !newlyASA){
            console.log('asa and prevASA is same')
            return res.status(200).json({ message: "No need to update" });
        }
        const asaEntries = Object.entries(asa).map(([key, amount]) => {
            // console.log(key)
            const [ASANo, projectID] = key.split('/');

            return {
                ASANo,
                projectID,
                amount
            }
        })

        
        const ors = req.body?.data?.ors ? req.body.data.ors.split('-') : [];
        const DV = req.body.DV
        const DVNoKey = DV?.DVNo ? DV.DVNo.split('-') : [];
        const fieldOfficeData = {
            date: DV.date,
            DVNoCount: DVNoKey,
            orsData: ors.length > 0 ? [ors.length - 1] : '',
            payee: DV.payee,
            particulars: DV.particulars,
            //amount
        }
        // console.log(asaEntries)
        //batch_handlefieldOffices
        
        let finalORS = ''
        const dvData = {ASA: asa}
        if(newlyASA){ 
            const ORS = await getOrigNumberOfCopiesBUR(ors)
            finalORS = `501-${year}-${month}-${ORS}`
            dvData.ORSBURS = finalORS
        }

        if(!newlyASA){

            const previousASA_amount = Object.entries(previousASA).reduce((acc, [key, value]) => {
                const newKey = key.split('/')[0];
                acc[newKey] = value;
                return acc
            }, {})

            const prevAsaEntries = Object.entries(previousASA).map(([key, amount]) => {
                // console.log(key)
                const [ASANo, projectID] = key.split('/');
    
                return {
                    ASANo,
                    projectID,
                    amount
                }
            })

            //previous ASA
            await batch_HandleControlBook(previousASA_amount, 'subtract')
            await batch_handlefieldOffices(prevAsaEntries, DVNoKey[DVNoKey.length-1], fieldOfficeData, 'subtract');

            //updated ASA
            await batch_HandleControlBook(ASA_amount)
            await batch_handlefieldOffices(asaEntries, DVNoKey[DVNoKey.length-1], fieldOfficeData);
        }else{
            //new ASA
            
            const ASA_amount = Object.entries(asa).reduce((acc, [key, value]) => {
                const newKey = key.split('/')[0];
                acc[newKey] = (acc[newKey] || 0) + value;
                return acc
            }, {})

            await batch_HandleControlBook(ASA_amount) //comment this first
            await batch_handlefieldOffices(asaEntries, DVNoKey[DVNoKey.length-1], fieldOfficeData);
        }

        const docref = db.collection('records').doc(id)
        await docref.update(dvData)
        res.status(200).json('Successfully Updated')
    }catch(err){
        res.status(500)
        console.log(`error on new updateASAORS (operator controller): ${err}`)
    }
}

const updateASA_ORS = async (req, res) => {
    const { ors, asa } = req.body.data

    const { date, DVNo, payee, particulars, amount } = req.body.DV
    const previousASA = req.body.previousASA
    const {id} = req.params
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1
    let finalORS = '';
    if(ors){
        const lastORS = ors.split('-').pop()
        const ORS = await getOrigNumberOfCopiesBUR(lastORS)
        finalORS = `501-${year}-${month}-${ORS}`
    }

    let orsData = ''

    const [ASANo, projectID] = asa.split('/')
    const [ , , , DVNoCount ] = DVNo.split('-')
    if(ors) {
        const [ , , , BURCount ] = ors.split('-')
        orsData = BURCount
    } 

    const dvData = {
        ORSBURS: finalORS,
        ASA: asa
    }

    fieldOffice = {
        date,
        DVNoCount, 
        orsData, 
        payee, 
        particulars, 
        amount
    } 

    try{
        //UPDATING THE ASA
        if(previousASA) { //NEXT
            const [prevASA, prevFO] = previousASA.split('/')
            const docRef = db.collection('ControlBook').doc(prevASA)
                            .collection('FieldOffices').doc(prevFO)
                            .collection('DV').doc(`${DVNoCount}|${amount}`);

            const docref = db.collection('ControlBook').doc(prevASA)
                            .collection('FieldOffices').doc(prevFO)

            
            const findDoc = await docRef.get();
            const doc = await docref.get()

            if (findDoc.exists) {
                await handleControlBook(prevASA, amount, 'subtract')
                const docdata = doc.data()
                const parseAmount = parseFloat(amount)
                const RO = parseFloat(docdata.RO)
                const FO = parseFloat(docdata.FO)
                const thisMonthFO = parseFloat(docdata.thisMonthFO)
                const weekFO = parseFloat(docdata.weekFO)

                const updatedRO = RO + parseAmount 
                const updatedFO = FO - parseAmount
                const updatedThisMonthFO = thisMonthFO - parseAmount
                const updatedThisMonthRO = updatedRO
                const updatedWeekFO = (weekFO - parseAmount) <= 0 ? weekFO - parseAmount : 0

                await docref.update({
                    RO: updatedRO,
                    FO: updatedFO,
                    thisMonthFO: updatedThisMonthFO, 
                    thisMonthRO: updatedThisMonthRO,
                    weekFO: updatedWeekFO,
                    weekRO: updatedRO
                });
 
                await handleFormDataRemainingAmount_RO(prevASA, prevFO, updatedRO)

                await docRef.delete();

                if(ASANo){
                    const ref = db.collection('ControlBook').doc(ASANo).collection('FieldOffices').doc(projectID)
                    const project = await ref.get()

                    if(project.exists){
                        await handleControlBook(ASANo, amount)
                        const projectdata = project.data()
                        const parseAmount = parseFloat(amount)
                        const RO = parseFloat(projectdata.RO)
                        const FO = parseFloat(projectdata.FO)
                        const thisMonthFO = parseFloat(projectdata.thisMonthFO)
                        const weekFO = parseFloat(projectdata.weekFO)

                        const updatedRO = RO - parseAmount 
                        const updatedFO = FO + parseAmount
                        const updatedThisMonthFO = thisMonthFO + parseAmount
                        const updatedThisMonthRO = updatedRO
                        const updatedWeekFO = weekFO + parseAmount

                        if(updatedRO < 0){
                            throw Error("Insufficient amount.")
                        }
                        await ref.update({
                            RO: updatedRO,
                            FO: updatedFO,
                            thisMonthFO: updatedThisMonthFO, 
                            thisMonthRO: updatedThisMonthRO,
                            weekFO: updatedWeekFO,
                            weekRO: updatedRO
                        });
                        await handleFormDataRemainingAmount_RO(ASANo, projectID, updatedRO)
                    }

                    await db.collection('ControlBook').doc(ASANo)
                        .collection('FieldOffices').doc(projectID)
                        .collection('DV').doc(`${DVNoCount}|${amount}`).set(fieldOffice)
                }
                

            } else {
                console.log('No document found')
            }
        } else { //DONE

            await handleControlBook(ASANo, amount) //DONE

            const docRef = db.collection('ControlBook').doc(ASANo).collection('FieldOffices').doc(projectID)
            const project = await docRef.get()

            if(project.exists){
                const parseAmount = parseFloat(amount)
                const projectdata = project.data()
                const RO = parseFloat(projectdata.RO)
                const FO = parseFloat(projectdata.FO)
                const thisMonthFO = parseFloat(projectdata.thisMonthFO)
                const weekFO = parseFloat(projectdata.weekFO)

                const updatedRO = RO - parseAmount 
                const updatedFO = FO + parseAmount
                const updatedThisMonthFO = thisMonthFO + parseAmount
                const updatedThisMonthRO = updatedRO
                const updatedWeekFO = weekFO + parseAmount

                if(updatedRO < 0){
                    throw Error("Insufficient amount.")
                }
                await docRef.update({
                    RO: updatedRO,
                    FO: updatedFO,
                    thisMonthFO: updatedThisMonthFO,
                    thisMonthRO: updatedThisMonthRO,
                    weekFO: updatedWeekFO,
                    weekRO: updatedRO
                });
                await handleFormDataRemainingAmount_RO(ASANo, projectID, updatedRO)
            }

            //DONE
            await db.collection('ControlBook').doc(ASANo)
                .collection('FieldOffices').doc(projectID)
                .collection('DV').doc(`${DVNoCount}|${amount}`).set(fieldOffice)
        }

        //DONE
        const docref = db.collection('records').doc(id)
        await docref.update(dvData)
        res.status(200).json('Successfully Updated')
    }catch(error){
        console.log('error on updatingASA_ORS: (OPERATORCONTROLLER)', error)
    }

}

const batch_handlefieldOffices = async (updates, DVNoCount, fieldOfficeData, operation='add') => {
    const batch = db.batch();
    
    try{
        for (const { ASANo, projectID, amount } of updates) {
            const docRef = db.collection('ControlBook').doc(ASANo).collection('FieldOffices').doc(projectID);
            const project = await docRef.get();
    
            if (project.exists) {
                const parseAmount = parseFloat(amount);
                const projectdata = project.data();
    
                const RO = parseFloat(projectdata.RO || 0);
                const FO = parseFloat(projectdata.FO || 0);
                const thisMonthFO = parseFloat(projectdata.thisMonthFO || 0);
                const weekFO = parseFloat(projectdata.weekFO || 0);
    
                let updatedRO, updatedFO, updatedThisMonthFO, updatedThisMonthRO, updatedWeekFO
                if(operation === 'add'){
                    updatedRO = RO - parseAmount;
                    updatedFO = FO + parseAmount;
                    updatedThisMonthFO = thisMonthFO + parseAmount;
                    updatedThisMonthRO = updatedRO;
                    updatedWeekFO = weekFO + parseAmount;
                }else{
                    updatedRO = RO + parseAmount;
                    updatedFO = FO - parseAmount;
                    updatedThisMonthFO = thisMonthFO - parseAmount;
                    updatedThisMonthRO = updatedRO;
                    updatedWeekFO = weekFO - parseAmount;
                }
    
                if (updatedRO < 0) {
                    console.error(`Insufficient amount for ASANo: ${ASANo}, projectID: ${projectID}`);
                    continue; // Skip this document and continue with others
                }
    
                // Add updates to the batch
                batch.update(docRef, {
                    RO: updatedRO,
                    FO: updatedFO,
                    thisMonthFO: updatedThisMonthFO,
                    thisMonthRO: updatedThisMonthRO,
                    weekFO: updatedWeekFO,
                    weekRO: updatedRO,
                });

                const DVDocRef = db.collection('ControlBook')
                    .doc(ASANo)
                    .collection('FieldOffices')
                    .doc(projectID)
                    .collection('DV')
                    .doc(`${DVNoCount}|${amount}`);
                
                if(operation == 'add'){
                    const fieldOfficed = {
                        ...fieldOfficeData,
                        amount: amount
                    }
    
                    batch.set(DVDocRef, fieldOfficed);
                }else{
                    batch.delete(DVDocRef)
                }
    
                // Optionally handle remaining amount separately
                await batch_handleFormDataRemainingAmount_RO(batch, ASANo, projectID, updatedRO);
            } else {
                console.warn(`Document not found for ASANo: ${ASANo}, projectID: ${projectID}`);
            }
        }
        await batch.commit()
    }catch(err){
        console.error('Error executing batch updates:', err);
    }
}

const getBUR = async(req, res) => {
    try{
        const year = new Date().getFullYear()
        const docRef = db.collection('NumberOfRecords').doc(year.toString())
        const doc = await docRef.get()
        if(doc.exists){
            const data = doc.data()
            const value = data['BURno']
            res.status(200).json({currentBUR: value})
        }else{
            const data = {
                DVno501CARP: '0000',
                DVno501COB: '0000',
                DVno501LFP: '0000',
                DVnoContractFarming: '0000',
                BURno: '0000'
            }
            await docRef.set(data);
            return res.status(200).json({currentBUR: '0000'})
        }
    }catch(error){
        console.log('error on getBUR (OPERATOR CONTROLLER)', error)
        res.status(500)
    }
}

const opReturnDocu = async (req, res) => {
    const {DV, payee, remarks} = req.body;
    const dispName = req.user.name;
    const uid = req.user.uid;

    const dateTimeCollection = getDateTime();
    const notifMessage1 = "The Disbursement Voucher for"
    const notifMessage2 = "has been returned by"
    const dataCollection = `${dateTimeCollection}|${payee}|${dispName}`
    const returnedBy = `${dispName}|${dateTimeCollection}`
    const comment = {dispName, remarks, dateTimeCollection}
    const logs = `${payee}!${DV}!Returned By ${dispName}!${dateTimeCollection}!Returned`

    try{
        const updatedDocu = await updateStatus(DV, returnedBy, true)
        const returnData = {
            [DV] : updatedDocu
        }
        const listOfEditorAcc = await getUsers('4');
        await setNotification(listOfEditorAcc, dataCollection, notifMessage1, notifMessage2, DV)
        if(remarks) {
            await addComments(DV, comment)
        }
        await setHistoryLogs(dateTimeCollection, logs)

        res.status(200).json({success: true, update: returnData});
    }catch(error){
        console.log('error returning records to editor: ', error)
        res.status(500).json({success: false, message: `error creating passed records: ${error}`});
    }
}

const updateStatus = async (DV, dTPassed, flag) => {
    const docref = db.collection('records').doc(DV);

    const updateData = flag ? 
        { returnedToPreparer: dTPassed, status: 'Returned|4' } : 
        { updatedBy: dTPassed, status: 'Under Review' };

    await docref.update(updateData);

    const updatedDoc = await docref.get();
    return updatedDoc.data();
};

const handleFormDataRemainingAmount_RO = async (controBookID, projectID, newAmount) => {
    try{
        const docRef = db.collection('formData').doc('ControlBook')
        const doc = await docRef.get()

        if(!doc.exists){
            console.log('Document not found')
            return
        }

        const data = doc.data()
        if (!data[controBookID] || !Array.isArray(data[controBookID])) {
            console.error(`controBookID ${controBookID} not found or is not an array`);
            return;
        }

        const updatedArray = data[controBookID].map((item) => {
            if (item.projectID === projectID) {
                return { ...item, RO: newAmount };
            }
            return item; 
        });

        await docRef.update({
            [controBookID]: updatedArray,
        });
    }catch(err){
        console.error('Error updating amount:', err);
    }
}

const batch_handleFormDataRemainingAmount_RO = async (batch, controBookID, projectID, newAmount) => {
    try{
        const docRef = db.collection('formData').doc('ControlBook')
        const doc = await docRef.get()

        if(!doc.exists){
            console.log('Document not found')
            return
        }

        const data = doc.data()
        if (!data[controBookID] || !Array.isArray(data[controBookID])) {
            console.error(`controBookID ${controBookID} not found or is not an array`);
            return;
        }

        const updatedArray = data[controBookID].map((item) => {
            if (item.projectID === projectID) {
                return { ...item, RO: newAmount };
            }
            return item; 
        });

        batch.update(docRef, {
            [controBookID]: updatedArray,
        })
    }catch(err){
        console.error('Error updating amount:', err);
    }
}

const batch_HandleControlBook = async (updates, operation='add') => {
    const batch = db.batch();
    console.log(updates, operation)
    for (const [ASANo, amount] of Object.entries(updates)) {
        const controlBookRef = db.collection('ControlBook').doc(ASANo);
        const controlBook = await controlBookRef.get();

        if (controlBook.exists) {
            const controlBookData = controlBook.data();
            const parseAmount = parseFloat(amount);
            const totalRO = parseFloat(controlBookData.RO);
            const totalFO = parseFloat(controlBookData.FO);
            const thisMonthFOValue = parseFloat(controlBookData.thisMonthFO || 0);
            const weekFO = parseFloat(controlBookData.weekFO);

            let updatedRO, updateFO, updatedThisMonthFO, updatedThisMonthRO, updatedWeekFO;

            if (operation === 'add') {
                updatedRO = totalRO - parseAmount;
                updateFO = totalFO + parseAmount;
                updatedThisMonthFO = thisMonthFOValue + parseAmount;
                updatedThisMonthRO = updatedRO;
                updatedWeekFO = weekFO + parseAmount;
            } else {
                updatedRO = totalRO + parseAmount;
                updateFO = totalFO - parseAmount;
                updatedThisMonthFO = thisMonthFOValue - parseAmount;
                updatedThisMonthRO = updatedRO;
                // updatedWeekFO = (weekFO - parseAmount) <= 0 ? weekFO - parseAmount : 0;
                updatedWeekFO = weekFO - parseAmount
            }

            batch.update(controlBookRef, {
                RO: updatedRO,
                FO: updateFO,
                thisMonthFO: updatedThisMonthFO,
                thisMonthRO: updatedThisMonthRO,
                weekFO: updatedWeekFO,
                weekRO: updatedRO,
            });
        } else {
            console.log(`Document ${ASANo} does not exist.`);
        }
    }
    await batch.commit()
}

const handleControlBook = async (ASANo, amount, operation='add') => {
    const controlBookRef = db.collection('ControlBook').doc(ASANo);
    const controlBook = await controlBookRef.get();

    if (controlBook.exists) {
        const controlBookdata = controlBook.data()
        let updatedRO
        let updateFO
        let updatedThisMonthFO
        let updatedThisMonthRO
        let updatedWeekFO

        if(operation == 'add'){
            const parseAmount = parseFloat(amount)
            const totalRO = parseFloat(controlBookdata.RO);
            const totalFO = parseFloat(controlBookdata.FO);
            const thisMonthFO_value = parseFloat(controlBookdata.thisMonthFO || 0)
            const weekFO = parseFloat(controlBookdata.weekFO)

            updatedRO = totalRO - parseAmount;
            updateFO = totalFO + parseAmount
            updatedThisMonthFO = thisMonthFO_value + parseAmount
            updatedThisMonthRO = updatedRO
            updatedWeekFO = weekFO + parseAmount
            
        }else{
            const parseAmount = parseFloat(amount)
            const totalRO = parseFloat(controlBookdata.RO);
            const totalFO = parseFloat(controlBookdata.FO);
            const thisMonthFO_value = parseFloat(controlBookdata.thisMonthFO || 0)
            const weekFO = parseFloat(controlBookdata.weekFO)

            updatedRO = totalRO + parseAmount;
            updateFO = totalFO - parseAmount
            updatedThisMonthFO = thisMonthFO_value - parseAmount
            updatedThisMonthRO = updatedRO
            updatedWeekFO = (weekFO - parseAmount) <= 0 ? weekFO - parseAmount : 0 
        }

        await controlBookRef.update({
            RO: updatedRO,
            FO: updateFO,
            thisMonthFO: updatedThisMonthFO,
            thisMonthRO: updatedThisMonthRO,
            weekFO: updatedWeekFO,
            weekRO: updatedRO
        });
    } else {
        console.log("No such document!");
    }
}

const handleBudget = async (body) => {
    const {date, DVNo, BUR, payee, particulars, amount,asa} = body 

    let orsData = ''

    const [ASANo, projectID] = asa.split('/')
    const [ , , , DVNoCount ] = DVNo.split('-')
    if(BUR) {
        const [ , , , BURCount ] = BUR.split('-')
        orsData = BURCount
    } 

    fieldOffice = {
        date,
        DVNoCount, 
        orsData, 
        payee, 
        particulars, 
        amount
    }

    try {
        const docRef = db.collection('ControlBook').doc(ASANo).collection('FieldOffices').doc(projectID)
        const project = await docRef.get()

        if(project.exists) {
            const parseAmount = parseFloat(amount)
            const totalRO = parseFloat(project.data().RO);
            const totalFO = parseFloat(project.data().FO);
            const updatedRO = totalRO - parseAmount;
            const updateFO = totalFO + parseAmount
            await updateFormData_RO(ASANo, projectID, updatedRO)
            await docRef.update({
                FO: updateFO,
                RO: updatedRO
            });
        } else {
            console.log("No such document!");
        }

        const controlBookRef = db.collection('ControlBook').doc(ASANo);
        const controlBook = await controlBookRef.get();

        if (controlBook.exists) {
            const parseAmount = parseFloat(amount)
            const totalRO = parseFloat(controlBook.data().RO);
            const totalFO = parseFloat(project.data().FO);
            const updatedRO = totalRO - parseAmount;
            const updateFO = totalFO + parseAmount

            await controlBookRef.update({
                RO: updatedRO,
                FO: updateFO
            });
        } else {
            console.log("No such document!");
        }

        await db.collection('ControlBook').doc(ASANo)
                .collection('FieldOffices').doc(projectID)
                .collection('DV').doc().set(fieldOffice)

        // res.status(200).json('Successfully Updated')
    } catch (error) {
        console.error("Error handleBudget: operator: ", error);
        // res.status(500).json({ success: false, error: error.message });
    }

}

const updateFormData_RO = async (ASANo, projectID, ROamount) => {
    try {
      // Get a reference to the document
      const docRef = db.collection("formData").doc("ControlBook")
      const projects = await docRef.get()
  
      // Fetch the document data
      if (projects.exists) {
        const data = projects.data();
  
        // Retrieve the arrayField for the specific projectID
        const arrayField = data[ASANo] || [];
  
        // Update the `RO` field for the matching item
        const updatedArray = arrayField.map((item) => {
          if (item.projectID === projectID) {
            return { ...item, RO: ROamount }; // Update the RO field
          }
          return item; // Leave other items unchanged
        });
  
        await docRef.update({ [ASANo]: updatedArray });
      } else {
        console.log("Document does not exist");
      }
    } catch (error) {
      console.error("Error updating RO of formData:", error);
    }
  };

const transferDocument = async (req, res) => {
    const {DV, payee, remarks} = req.body.data;
    const { date, DVNo, BUR, particulars, amount, asa } = req.body.fieldOfficeData
    const dispName = req.user.name;
    const uid = req.user.uid;
    
    const dateTimeCollection = getDateTime();
    const notifMessage1 = "The Disbursement Voucher for"
    const notifMessage2 = "has been passed by"
    const dataCollection = `${dateTimeCollection}|${payee}|${dispName}`
    const updatedBy = `${dispName}|${dateTimeCollection}`
    const comment = {dispName, remarks, dateTimeCollection}
    const logs = `${payee}!${DV}!Updated By ${dispName}!${dateTimeCollection}!Under Review`

    try {
         await updateStatus(DV, updatedBy, false)
        const listOfHeadAcc = await getUsers('2');
        await setNotification(listOfHeadAcc, dataCollection, notifMessage1, notifMessage2, DV)
        if(remarks) {
            await addComments(DV, comment)
        }
        await setHistoryLogs(dateTimeCollection, logs)

        res.status(200).json({message: 'Disbursement Voucher has been returned'});
    }catch(error){
        console.log('error creating passed records: ', error)
        res.status(500).json({success: false, message: `error creating passed records: ${error}`});
    }
}

const getPermission = async(req, res) => {
    try {
        const docref = await db.collection('Roles').doc('Funding').get()
        if(docref.exists){
            const data = docref.data()
            res.status(200).json({data: data})
        }
    }catch(error){
        console.log(`Error retrieving Preparer Permision ${error}`)
        res.status(500).json({ success: false, error: error.message });
    }
}

const auth = new google.auth.GoogleAuth({
    credentials: {
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        toker_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL ,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
const appendDataToSheet = async (req, res) => {
    const  values  = req.body
    const spreadsheetId = process.env.SPREADSHEETID
    const client = await auth.getClient();
    
    // Append values to the next available row
    const request = {
      spreadsheetId, // Google Sheets ID
      range: 'A1:Z', // The sheet/tab name where data will be appended
      valueInputOption: 'RAW', // You can also use 'USER_ENTERED' to auto-format data
      insertDataOption: 'INSERT_ROWS', // Automatically finds the next available row
      resource: {
        values, // This is a 2D array representing rows and columns (e.g. [[row1data], [row2data]])
      },
      auth: client,
    };
  
    try {
        const response = await sheets.spreadsheets.values.append(request);
        res.status(200).send({message: 'Data appended successfully', data: response.data.updates});
    } catch (err) {
        console.error('Error appending data:', err);
    }
  };

  const createAcronym = (input) => {
    const phraseStopWords = [
        "a", "an", "and", "are", "as", "at", "by", "for", "from", "in",
        "is", "it", "of", "on", "or", "that", "the", "to", "with", "about",
        "above", "across", "after", "against", "along", "among", "around",
        "before", "behind", "below", "beneath", "beside", "between", "beyond",
        "but", "by", "despite", "during", "except", "following", "for",
        "from", "in", "including", "into", "like", "near", "of", "off", 
        "on", "onto", "out", "over", "past", "since", "through", "throughout", 
        "till", "to", "toward", "under", "until", "up", "upon", "with", 
        "within", "without"
      ];
    const words = input.split(' ');
    const filteredWords = words.filter(word => !phraseStopWords.includes(word.toLowerCase())); 
    const acronym = filteredWords.map(word => word[0].toUpperCase()).join('');
    return acronym
  }

  const addControlBook = async(req, res) => {
    const { ASANo, date, SARONo, TotalASA, fundCluster, description, endDate } = req.body.data

    const dateTimeCollection = getDateTime();
    const finalASANo = `${ASANo}|${createAcronym(description)}!${fundCluster}`

    const data = {
        ASANo: finalASANo,
        DateOfAsa: date,
        SARONo: SARONo,
        TotalASA: TotalASA,
        FundCluster: fundCluster,
        description: description,
        createdAt: dateTimeCollection,
        RO: TotalASA,
        FO: 0,
        endDate: endDate,
        leftBudget: TotalASA,
        prevMonthFO: 0,
        prevMonthRO: 0,
        thisMonthFO: 0,
        thisMonthRO: 0,
        cbStatus: 'active',
        weekFO: 0,
        week1FO: 0,
        week2FO: 0,
        week3FO: 0,
        week4FO: 0,
        week5FO: 0,
        weekRO: 0,
        week1RO: 0,
        week2RO: 0,
        week3RO: 0,
        week4RO: 0,
        week5RO: 0,

    }

    try {
        await db.collection('ControlBook').doc(finalASANo).set(data)

        await db.collection('formData').doc('ControlBook').set({
            [finalASANo]: []
        }, {merge: true})

        res.status(200).json({message: 'Control Book successfully added'})


    } catch (error) {
        console.log(`Error adding control book: ${error}`)
        res.status(500).json({ success: false, error: error.message });
    }
  }

  const addNewFieldOffice = async(req, res) => {
    const { projectName, fieldOffice, ASA, tabStatus } = req.body.data
    const  projectID  = req.body.projectID
    const { id } = req.params

    const dateTimeCollection = getDateTime();

    const data = {
        fieldOffice: fieldOffice,
        projectName: projectName,
        ASA: ASA,
        createdAt: dateTimeCollection,
        RO: ASA,
        FO: 0,
        leftBudget: ASA,
        prevMonthFO: 0,
        prevMonthRO: 0,
        thisMonthFO: 0,
        thisMonthRO: 0,
        weekFO: 0,
        week1FO: 0,
        week2FO: 0,
        week3FO: 0,
        week4FO: 0,
        week5FO: 0,
        weekRO: 0,
        week1RO: 0,
        week2RO: 0,
        week3RO: 0,
        week4RO: 0,
        week5RO: 0,
        tabStatus: tabStatus,
    }

    const formData = {
        projectID: projectID,
        projectName: projectName,
        RO: ASA
    }

    try {
        const controlBookRef = db.collection('ControlBook').doc(id);
        const controlBook = await controlBookRef.get();

        if (controlBook.exists) {
            const parseASA = parseFloat(ASA)
            const leftBudget = parseFloat(controlBook.data().leftBudget);
            const updatedBudget = leftBudget - parseASA;

            if(updatedBudget < 0){
                throw Error("Insufficient amount.")
            }

            await controlBookRef.update({
                leftBudget: updatedBudget
            });
        } else {
            console.log("No such document!");
        }
        await db.collection('ControlBook').doc(id).collection('FieldOffices').doc(projectID).set(data)
        await db.collection('formData').doc('ControlBook').update({
            [id]: admin.firestore.FieldValue.arrayUnion(formData)
        })
        res.status(200).json({message: 'Field Office Successfully Created'})
    } catch (error) {
        console.log(`Error adding field office: ${error}`)
        res.status(500).json({ success: false, error: error.message });
    }
  }

const addTab = async(req, res) => {
    const tabs = req.body
    const {id} = req.params
    try{
        const controlBookRef = db.collection('ControlBook').doc(id)
        await controlBookRef.update({
            tabs: tabs
        })
        return res.status(200).json({ message: 'Tab added successfully' });
    }catch(err){
        console.log(`error on adding tab in operator controller ${err}`)
        return res.status(500).json({ error: 'Failed to add tab. Please try again later.' });
    }
}

const updateControlBook = async(req, res) => {
    const { id } = req.params
    const { ASANo, date, SARONo, TotalASA, fundCluster,description } = req.body.data

    const dateTimeCollection = getDateTime();
    const finalASANo = `${ASANo}|${createAcronym(description)}!${fundCluster}`

    const data = {
        ASANo: finalASANo,
        DateOfAsa: date,
        SARONo: SARONo,
        TotalASA: TotalASA,
        FundCluster: fundCluster,
        description: description,
        updatedAt: dateTimeCollection
    }

    try {
        const docRef = db.collection('ControlBook').doc(id)
        await docRef.update(data)
        res.status(200).json({message: 'Control Book Successfully Updated'})
    } catch (error) {
        console.log(`Error book: ${error}`)
        res.status(500).json({ success: false, error: error.message });
    }
}

  const deleteControlBook = async(req, res) => {
    const { id } = req.params
    console.log(`deleting id: ${id}`)
    try{
        await db.collection('ControlBook').doc(id).delete();
        await db.collection('formData').doc('ControlBook').update({
            [id]: admin.firestore.FieldValue.delete()
        })
        res.status(200).json({ message: 'Control Book successfully deleted' })
    }
    catch(error){
        console.error("Error deleting control book: ", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

const updateFieldOffice = async(req, res) => {
    const { id } = req.params
    const [ASANo, docId] = id.split('!')
    const fieldOfficeData = req.body.data
    const LeftBudget = req.body.leftBudget
    const {RO, projectID, projectName} = req.body.prevData

    const dateTimeCollection = getDateTime();
    // console.log(req.body)
    const data = {
        ...fieldOfficeData,
        updatedAt: dateTimeCollection,
        leftBudget: fieldOfficeData.ASA,
        RO: fieldOfficeData.ASA
    }

    formData = {
        RO: RO,
        projectID: projectID,
        projectName: projectName
    }
    console.log(fieldOfficeData)

    const updatedFieldOfficeData = {
        RO: fieldOfficeData.ASA,
        projectID: projectID,
        projectName: fieldOfficeData.projectName
    }
    // FORMULA :   newLeftBudget = LeftBudget + RO - desireUpdate
    //             newLeftBudget = Latest + Current - update
    const updatedLeftBudget = parseFloat(LeftBudget) + parseFloat(RO) - parseFloat(fieldOfficeData.ASA)
    console.log(`${updatedLeftBudget} = ${LeftBudget} + ${RO} - ${fieldOfficeData.ASA}`)
    try {
        const controlBookRef = db.collection('ControlBook').doc(ASANo)
        controlBookRef.update({leftBudget: updatedLeftBudget})
        const docRef = db.collection('ControlBook').doc(ASANo).collection('FieldOffices').doc(docId)
        await docRef.update(data)
        const docref = db.collection('formData').doc('ControlBook')
        await docref.update({
            [ASANo]: admin.firestore.FieldValue.arrayRemove(formData)
        })
        await docref.update({
            [ASANo]: admin.firestore.FieldValue.arrayUnion(updatedFieldOfficeData)
        })
        res.status(200).json({message: 'Field Office Successfully Updated'})
    } catch (error) {
        console.log(`Error book: ${error}`)
        res.status(500).json({ success: false, error: error.message });
    }
}



const deleteFieldOffice = async(req, res) => {
    const { id } = req.params
    const [ASANo, docId, projectName, RO, totalASA] = id.split('!')
    const data = {
        RO: RO,
        projectID: docId,
        projectName: projectName
    }

    try {
        const controlBookRef = db.collection('ControlBook').doc(ASANo);
        const controlBook = await controlBookRef.get();

        if (controlBook.exists) {
            const parseASA = parseFloat(totalASA)
            const leftBudget = parseFloat(controlBook.data().leftBudget);
            const updatedBudget = leftBudget + parseASA;

            await controlBookRef.update({
                leftBudget: updatedBudget
            });
        } else {
            console.log("No such document!");
        }

        const project = db.collection('ControlBook').doc(ASANo).collection('FieldOffices').doc(docId)
        const subcollectionRef = project.collection('DV');
        const subDocs = await subcollectionRef.get();
        
        subDocs.forEach(async (subDoc) => {
            await subDoc.ref.delete();
        });
        await project.delete()

        const docRef = db.collection('formData').doc('ControlBook')
        await docRef.update({
            [ASANo]: admin.firestore.FieldValue.arrayRemove(data)
        })
        res.status(200).json({message: 'Field Office Successfully Deleted'})
    } catch (error) {
        console.log(`Error book: ${error}`)
        res.status(500).json({ success: false, error: error.message });
    }
}

const getOrigNumberOfCopiesBUR = async(givenNo) => {
    try{
        const today = new Date();
        const year = today.getFullYear();
        const docRef = db.collection('NumberOfRecords').doc(year.toString());
        
        return await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef)
            if(!doc.exists){
                throw new Error('Document does not exist!')
            }
            const data = doc.data()
            const currentNoBUR = data['BURno'] || givenNo

            let incrementedByOne;
            if(currentNoBUR === givenNo){
                console.log(currentNoBUR, givenNo, 'here')
                incrementedByOne = parseInt(givenNo, 10).toString().padStart(4, '0');
            }else{
                console.log(currentNoBUR, givenNo, 'here2')
                incrementedByOne = (parseInt(currentNoBUR, 10)+1).toString().padStart(4, '0');
            }

            transaction.update(docRef, {
                ['BURno'] : incrementedByOne
            });

            return incrementedByOne
        })

    }catch(error){
        console.log(`Error on get_ORIG_NumberOfCopies for BUR (operator controller) ${error}`)
    }
}

const getWeek = () => {
    const date = new Date().toISOString().split('T')[0]
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const dayOfWeek = startOfMonth.getDay();
    const weekNum = Math.ceil((dayOfMonth + dayOfWeek) / 7)

    return `week${weekNum}`;

}

const theDifference = (obj1 = {}, obj2 = {}, needed=false) => {
    const diff1 = {};
    const diff2 = {};

    if(Object.keys(obj1).length === 0 || Object.keys(obj2).length === 0){
        return {obj1: obj1, obj2: obj2}
    }

    if(needed){
        return {obj1: obj1, obj2: obj2}
    }

    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    allKeys.forEach(key => {
        if (obj1[key] !== obj2[key]) {
            if (key in obj1) {
                diff1[key] = obj1[key];
            }
            if (key in obj2) {
                diff2[key] = obj2[key];
            }
        }
    });

    return { obj1: diff1, obj2: diff2 };
}

module.exports = {
    opReturnDocu, 
    transferDocument,
    getPermission,
    appendDataToSheet,
    addControlBook,
    addNewFieldOffice,
    updateControlBook,
    deleteControlBook,
    updateFieldOffice,
    deleteFieldOffice,
    updateASA_ORS,
    getBUR,
    updateASAORS,
    addTab
}