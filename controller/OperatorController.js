const {admin, db, rtdb}  = require('../config/firebase')
const { google } = require('googleapis');
const sheets = google.sheets('v4');

const { 
    addComments,
    setNotification,
    setHistoryLogs,
    updateUserAcc } = require('./MultiAccess/Functions');

const updateASA_ORS = async (req, res) => {
    const { ors, asa } = req.body.data

    const { date, DVNo, payee, particulars, amount } = req.body.DV
    const previousASA = req.body.previousASA
    const {id} = req.params
    
    console.log(req.body.DV)

    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1
    let finalORS = '';
    if(ors){
        const lastORS = ors.split('-').pop()
        const ORS = await getOrigNumberOfCopiesBUR(lastORS)
        finalORS = `501-${year}-${month}-${ORS}`
    }
    console.log(finalORS ? finalORS: 'asd')
    console.log(asa ? asa : 'asa')

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
        if(previousASA) {
            const [prevASA, prevFO] = previousASA.split('/')
            const docRef = db.collection('ControlBook').doc(prevASA)
                            .collection('FieldOffices').doc(prevFO)
                            .collection('DV').doc(`${DVNoCount}|${amount}`);

            const docref = db.collection('ControlBook').doc(prevASA)
                            .collection('FieldOffices').doc(prevFO)

            
            const findDoc = await docRef.get();
            const doc = await docref.get()

            if (findDoc.exists) {

                const parseAmount = parseFloat(amount)
                const RO = parseFloat(doc.data().RO)
                const FO = parseFloat(doc.data().FO)
                const updatedRO = RO + parseAmount 
                const updatedFO = FO - parseAmount

                await docref.update({
                    RO: updatedRO,
                    FO: updatedFO
                });

                await docRef.delete();

                const ref = db.collection('ControlBook').doc(ASANo).collection('FieldOffices').doc(projectID)
                const project = await ref.get()

                if(project.exists){
                    const parseAmount = parseFloat(amount)
                    const RO = parseFloat(project.data().RO)
                    const FO = parseFloat(project.data().FO)
                    const updatedRO = RO - parseAmount 
                    const updatedFO = FO + parseAmount

                    if(updatedRO < 0){
                        throw Error("Insufficient amount.")
                    }
                    await ref.update({
                        RO: updatedRO,
                        FO: updatedFO
                    });
                }

                await db.collection('ControlBook').doc(ASANo)
                    .collection('FieldOffices').doc(projectID)
                    .collection('DV').doc(`${DVNoCount}|${amount}`).set(fieldOffice)
                
                

            } else {
                console.log('walang nahanap')
            }
        } else {

            await handleControlBook(ASANo, amount)

            const docRef = db.collection('ControlBook').doc(ASANo).collection('FieldOffices').doc(projectID)
            const project = await docRef.get()

            if(project.exists){
                const parseAmount = parseFloat(amount)
                const RO = parseFloat(project.data().RO)
                const FO = parseFloat(project.data().FO)
                const updatedRO = RO - parseAmount 
                const updatedFO = FO + parseAmount

                if(updatedRO < 0){
                    throw Error("Insufficient amount.")
                }
                await docRef.update({
                    RO: updatedRO,
                    FO: updatedFO
                });
            }


            await db.collection('ControlBook').doc(ASANo)
                .collection('FieldOffices').doc(projectID)
                .collection('DV').doc(`${DVNoCount}|${amount}`).set(fieldOffice)
        }

        const docref = db.collection('records').doc(id)
        await docref.update(dvData)
        res.status(200).json('Successfully Updated')
    }catch(error){
        console.log('error on updatingASA_ORS: (OPERATORCONTROLLER)', error)
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

const operatorInput = async(req, res) => {
    const { ors, asa } = req.body.fundingData
    const { date, DVNo, BUR, payee, particulars, amount } = req.body.fieldOfficeData
    const previousASA = req.body.previousASA
    const { id } = req.params

    let orsData = ''

    const [ASANo, projectID] = asa.split('/')
    const [ , , , DVNoCount ] = DVNo.split('-')
    if(ors) {
        const [ , , , BURCount ] = ors.split('-')
        orsData = BURCount
    } 


    dvData = {
        ORSBURS: ors ? ors : '',
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

    try {
        if(previousASA) {
            const [prevASA, prevFO] = previousASA.split('/')
            console.log('may laman', prevASA, prevFO)
            const docRef = db.collection('ControlBook').doc(prevASA)
                            .collection('FieldOffices').doc(prevFO)
                            .collection('DV').doc(`${DVNoCount}|${amount}`);

            const findDoc = await docRef.get();

            if (findDoc.exists) {
                console.log('may nahanap', findDoc.data());
                await docRef.delete();
                await db.collection('ControlBook').doc(ASANo)
                    .collection('FieldOffices').doc(projectID)
                    .collection('DV').doc().set(fieldOffice)
            } else {
                console.log('walang nahanap')
            }
        } else {
            console.log('walang laman')
            await db.collection('ControlBook').doc(ASANo)
                .collection('FieldOffices').doc(projectID)
                .collection('DV').doc(`${DVNoCount}|${amount}`).set(fieldOffice)
        }

        const docref = db.collection('records').doc(id)
        await docref.update(dvData)

        res.status(200).json('Successfully Updated')
    } catch (error) {
        console.error("Error updating document: operator: ", error);
        res.status(500).json({ success: false, error: error.message });
    }

}

const opReturnDocu = async (req, res) => {
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
    const notifMessage2 = "has been returned by"
    const dataCollection = `${dateCollection}|${timeCollection}|${payee}|${dispName}`
    const dateTimePassed = `${dateCollection}|${timeCollection}`;
    const returnedBy = `${dispName}|${dateTimePassed}`
    const comment = {dispName, remarks, dateTimePassed}
    const logs = `${payee}!${DV}!Returned By ${dispName}!${dateTimePassed}`

    try{
        const updatedDocu = await updateStatus(DV, returnedBy, true)
        const returnData = {
            [DV] : updatedDocu
        }
        const listOfEditorAcc = await getListOfEditorAccounts();
        await setNotification(listOfEditorAcc, dataCollection, notifMessage1, notifMessage2, DV)
        if(remarks) {
            await addComments(DV, comment)
        }
        await setHistoryLogs(dateTimePassed, logs)

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


const getListOfEditorAccounts = async () => {
    try{

        const docref = await db.collection('listOfUsers').get()

        const uids = []

        docref.forEach(doc => {
            const data = doc.data()

            if(data.role === '4' && data.uid){
                uids.push(data.uid)
            }
        })

        return uids;

    }catch(error){
        console.log(`Error in getting list of editor : ${error}`)
    }
    return [];
}

const handleControlBook = async (ASANo, amount) => {
    const controlBookRef = db.collection('ControlBook').doc(ASANo);
    const controlBook = await controlBookRef.get();

    if (controlBook.exists) {
        const parseAmount = parseFloat(amount)
        const totalRO = parseFloat(controlBook.data().RO);
        const totalFO = parseFloat(controlBook.data().FO);
        const updatedRO = totalRO - parseAmount;
        const updateFO = totalFO + parseAmount

        await controlBookRef.update({
            RO: updatedRO,
            FO: updateFO
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
    const updatedBy = `${dispName}|${dateTimePassed}`
    const comment = {dispName, remarks, dateTimePassed}
    const logs = `${payee}!${DV}!Updated By ${dispName}!${dateTimePassed}`

    try {
        const updatedDocu = await updateStatus(DV, updatedBy, false)
        const returnData = {
            [DV] : updatedDocu
        }
        const listOfHeadAcc = await getListOfHeadAccounts();
        await setNotification(listOfHeadAcc, dataCollection, notifMessage1, notifMessage2, DV)
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

const getListOfHeadAccounts = async () => {
    try{

        const docref = await db.collection('listOfUsers').get()

        const uids = []

        docref.forEach(doc => {
            const data = doc.data()

            if(data.role === '2' && data.uid){
                uids.push(data.uid)
            }
        })

        return uids;

    }catch(error){
        console.log(`Error in getting list of op : ${error}`)
    }
    return [];
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
    const { ASANo, date, SARONo, TotalASA, description, endDate } = req.body.data

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

    const dateTimeCollection = `${dateCollection} ${timeCollection}`;
    const finalASANo = `${ASANo}|${createAcronym(description)}`

    const data = {
        ASANo: finalASANo,
        DateOfAsa: date,
        SARONo: SARONo,
        TotalASA: TotalASA,
        description: description,
        createdAt: dateTimeCollection,
        RO: TotalASA,
        FO: 0,
        endDate: endDate,
        leftBudget: TotalASA
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
    const { projectName, fieldOffice, ASA } = req.body.data
    const  projectID  = req.body.projectID
    const { id } = req.params

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

    const dateTimeCollection = `${dateCollection} ${timeCollection}`;

    const data = {
        fieldOffice: fieldOffice,
        projectName: projectName,
        ASA: ASA,
        createdAt: dateTimeCollection,
        RO: ASA,
        FO: 0,
        leftBudget: ASA
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

  const updateControlBook = async(req, res) => {
    const { id } = req.params
    const { ASANo, date, SARONo, TotalASA, description } = req.body.data
    
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

    const dateTimeCollection = `${dateCollection} ${timeCollection}`;
    const finalASANo = `${ASANo}|${createAcronym(description)}`

    const data = {
        ASANo: finalASANo,
        DateOfAsa: date,
        SARONo: SARONo,
        TotalASA: TotalASA,
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
    const {RO, projectID, projectName} = req.body.prevData

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

    const dateTimeCollection = `${dateCollection} ${timeCollection}`;

    const data = {
        ...fieldOfficeData,
        updatedAt: dateTimeCollection
    }

    formData = {
        RO: RO,
        projectID: projectID,
        projectName: projectName
    }

    try {
        const docRef = db.collection('ControlBook').doc(ASANo).collection('FieldOffices').doc(docId)
        await docRef.update(data)
        const docref = db.collection('formData').doc('ControlBook')
        await docref.update({
            [ASANo]: admin.firestore.FieldValue.arrayRemove(formData)
        })
        await docref.update({
            [ASANo]: admin.firestore.FieldValue.arrayUnion(fieldOfficeData)
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
                incrementedByOne = (parseInt(givenNo, 10)+1).toString().padStart(4, '0');
            }else{
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

const updateAccount = async(req, res) => {
    const {name, role} = req.body
    const uid = req.user.uid
    console.log(name, uid, role)
    try {
        const response = await updateUserAcc(uid, role, name)

        const uname = response.customClaims.dispName
        const urole = response.customClaims.role
        const userid = response.uid
        const email = response.email

        res.status(200).json({ success: true, role: urole, name: uname, uid: userid, uemail: email})
    } catch (error) {
        console.log(`Error updating ${error}`)
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    operatorInput, 
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
    updateAccount,
    getBUR
}