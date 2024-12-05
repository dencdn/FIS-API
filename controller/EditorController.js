const {admin, db, rtdb}  = require('../config/firebase');
const { doc } = require('firebase/firestore')

const { 
    addComments,
    setNotification,
    setHistoryLogs,
    getDateTime,
    getUsers
} = require('./MultiAccess/Functions');
const { messaging } = require('firebase-admin');

const formatDate = (rawDate) => {
    const dateObject = new Date(rawDate);
    
    if (isNaN(dateObject.getTime())) {
      return "Invalid date";
    }

    const formattedDate = dateObject.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });

    return formattedDate;
  };
const createDV = async (req, res) => {
    const {payee, TIN, address, fund, date, DV, MOP, specifiedMOP, origNumber, template, RC, NF_name, NF_office,TT_tax, TT_formula1, TT_formula2, TT_cost, accCategory, accTitle, accCode,optionalAmount, amount, particular} = req.body.payee_data;
    const {birParticular} = req.body.bir_data
    const createdBy = req.user.name
    
    const DVnoKey = `DVno${fund.replace(/\s/g, '')}`
    const finalizeDVNo = await getOrigNumberOfCopies(DVnoKey, origNumber, DV, template)
    const DVKey = `${finalizeDVNo}|${fund.replace(/\s/g, '')}`

    const dateTimeCollection = getDateTime();
    const createdByDetails = `${createdBy} at ${dateTimeCollection}`

    const payeeData = req.body.payee_data

    newDvData = {
        ...payeeData,
        date: formatDate(date),
        DV: finalizeDVNo,
        DVKey: DVKey,
        birParticular: birParticular.trim(),
        createdAt: dateTimeCollection,
        createdBy: createdByDetails,
        status: 'Drafting',
    }

    dvData = {
        //payee data
        payee: payee.trim(), 
        TIN: TIN, 
        address: address,
        fund: fund,
        date: formatDate(date), 
        DV: finalizeDVNo,
        DVKey: DVKey, 
        modeOfPayment: MOP,
        specifiedMOP: specifiedMOP,
        RC: RC,
        NF_name: NF_name,
        NF_office: NF_office,
        TT_tax: TT_tax,
        TT_formula1: TT_formula1,
        TT_formula2: TT_formula2,
        TT_cost: TT_cost,
        accCategory: accCategory, 
        accTitle: accTitle,
        accCode: accCode,
        optionalAmount: optionalAmount, 
        amount: amount, 
        particular: particular.trim(),
        //BIR data
        birParticular: birParticular.trim(),
        //other data
        createdAt: dateTimeCollection,
        createdBy: createdByDetails,
        status: 'Drafting',
        //open for necessary data needed
    }
    try{
        await db.collection('records').doc(newDvData.DVKey).set(newDvData);

        // addOnCategoryPerMonth(amount, optionalAmount, accCategory, date)
        // addOnClusterAmount(amount, fund, date)

        return res.status(200).json({message: 'Disbursement Voucher has been created'});

    }catch(error){
        console.log(`Error in saving data of payee and BIR: ${error}`)
        return res.status(500).json({ 
            success: false, 
            message: 'Error in saving data of payee and BIR', 
            error: error.message 
        });
    }

}

const updateStatus = async (DV, dTPassed) => {
    const docref = db.collection('records').doc(DV)
    await docref.update({
        submittedBy: dTPassed,
        status: 'In Review'
    })
    const updatedDoc = await docref.get()
    return updatedDoc.data();
}

const passDocument = async (req, res) => {
    const {DV, payee, remarks} = req.body;
    const dispName = req.user.name;
    const uid = req.user.uid;

    const dateTimeCollection = getDateTime();
    const notifMessage1 = "The Disbursement Voucher for"
    const notifMessage2 = "has been passed by"
    const dataCollection = `${dateTimeCollection}|${payee}|${dispName}`
    const submittedBy = `${dispName}|${dateTimeCollection }`
    const logs = `${payee}!${DV}!Submitted By ${dispName}!${dateTimeCollection}!In Review`
    const comment = {dispName, remarks, dateTimeCollection}

    try {
        await updateStatus(DV, submittedBy)
        const listOfOpAcc = await getUsers('3');
        await setNotification(listOfOpAcc, dataCollection, notifMessage1, notifMessage2, DV)
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

const getAccountCodes = async (req, res) => {
    const documentIds = ['accountFields', 'accountFields_1', 'accountFields_2'];
    const combinedData = {};
    try{
        const accountCodesSnapshot = await db.collection('account_codes').get();
        for (const docId of documentIds){
            const docRef = db.collection('account_codes').doc(docId);
            const docSnapshot = await docRef.get();

            if (docSnapshot.exists){
                const docData = docSnapshot.data();
                Object.keys(docData).forEach(fieldKey => {
                    combinedData[fieldKey] = docData[fieldKey]
                });
            }else{
                console.log(`Document ${docId} does not exist.`);
            }
        }
        console.log('successfully retrieved');
        res.status(200).json({account_codes: combinedData})
        
    }catch(error){
        console.log('Error retrieving account fields:', error)
    }
}

const deleteDV = async(req, res) => {
    const { id } = req.params

    try{

        const docRef = db.collection('records').doc(id);
        const docSnapshot = await docRef.get()

        if(docSnapshot.exists){
            const recordData = docSnapshot.data()
            const optionalAmount = recordData['optionalAmount']
            const amount = recordData['amount']
            const date = recordData['date']
            const accCategory = recordData['accCategory']
            const fund = recordData['fund']
            // await addOnCategoryPerMonth(amount, optionalAmount, accCategory, date, 'subtract')
            // await addOnClusterAmount(amount, fund, date, 'subtract')

            await db.collection('records').doc(id).delete();
            res.status(200).json({ message: 'Document successfully deleted' })
        }else{
            res.status(404).json({ message: 'Document Not Fuund' })
        }
    }
    catch(error){
        console.error("Error deleting documents: ", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

const updateDV = async(req, res) => {
    const { id } = req.params
    // const {payee, TIN, address, fund, date, DV, DVKey, RC, NF_name, NF_office, TT_cost, TT_formula1, TT_formula2, TT_tax, optionalAmount,accTitle, accCode, amount, particular} = req.body.payee_data;
    const {birParticular} = req.body.bir_data
    const payeeData = req.body.payee_data


    const dateTimeCollection = getDateTime();
    const dvData = {
        ...payeeData,
        birParticular,
        updatedAt: dateTimeCollection
    }

    try {
        const docref = db.collection('records').doc(id)
        await docref.update(dvData)

        res.status(200).json({message: 'Disbursement Voucher has been updated'})
    } catch (error) {
        console.error("Error updating document: ", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

const getFormData = async (req, res) => {
    try{
        const docRef = db.collection('formData')
        const snapshot = await docRef.get()

        if (snapshot.empty) {
            res.status(404).json({ success: false, message: 'No form data found.' });
            return;
        }

        const formData = {};
            snapshot.forEach(doc => {
            formData[doc.id] = doc.data();
        });

        res.status(200).json({ success: true, form: formData });
    }catch(error){
        console.log(`Error fetching form data ${error}`)
        res.status(500).json({ success: false, error: error.message });
    }
}

const getPermission = async(req, res) => {
    try {
        const docref = await db.collection('Roles').doc('Preparer').get()
        if(docref.exists){
            const data = docref.data()
            res.status(200).json({data: data})
        }
    }catch(error){
        console.log(`Error retrieving Preparer Permision ${error}`)
        res.status(500).json({ success: false, error: error.message });
    }
}

const getNumberOfCopies = async (req, res) => {

    try{
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const docRef = db.collection('NumberOfRecords').doc(year.toString());
        const doc = await docRef.get()
        if ((month === 1 && day === 1) || !doc.exists) {
            const data = {
                DVno501CARP: '0000',
                DVno501COB: '0000',
                DVno501LFP: '0000',
                DVnoContractFarming: '0000',
                BURno: '0000'
            }
            await docRef.set(data);
            return res.status(200).json({data: data})
        }else{
            const data = doc.data()
            console.log(data)
            res.status(200).json({data: data})
        }
        
    }catch(error){
        console.log(`Error on getNumberOfCopies(editor controller) ${error}`)
        res.status(500).json({ success: false, error: error.message });
    }
}

const getOrigNumberOfCopies = async(dvno, givenNo, DV, template) => {
    try{
        const today = new Date();
        const year = today.getFullYear();
        const docRef = db.collection('NumberOfRecords').doc(year.toString());
        return await db.runTransaction(async(transaction) => {
            const doc = await transaction.get(docRef);
            if (!doc.exists) {
                throw new Error('Document does not exist!');
            }

            const data = doc.data();
            const currentNoOfCopies = data[dvno] || givenNo

            let incrementedByOne;
            if (currentNoOfCopies === givenNo) {
                incrementedByOne = (parseInt(givenNo, 10) + 1).toString().padStart(4, '0');
            } else {
                incrementedByOne = (parseInt(currentNoOfCopies, 10) + 1).toString().padStart(4, '0');
            }

            transaction.update(docRef, {
                [dvno]: incrementedByOne
            });

            return `${template}${incrementedByOne}`;
        })
        
    }catch(error){
        console.log(`Error on get_ORIG_NumberOfCopies(editor controller) ${error}`)
        return 0
    }
}

const savePayeeData = async (req, res) => {
    try{
        const {key, data} = req.body
        
        await db.collection('payee').doc(key).set(data)
        const document = {
            [key] : data
        }
        res.status(200).json(document)
    }catch(error){
        console.log(`Error on saving payee data ${error}`)
        res.status(500)
    }
}

const getPayeeData = async (req,res) => {
    try{
        const docRef = db.collection('payee')
        const snapshot = await docRef.get()

        if (snapshot.empty) {
            res.status(404).json({ success: false, message: 'No form data found.' });
            return;
        }

        const listofpayee = {};
            snapshot.forEach(doc => {
                listofpayee[doc.id] = doc.data();
        });

        res.status(200).json({ success: true, document: listofpayee });

    }catch(error){
        console.log(`Error getting payee collection ${error}`)
        res.status(500).json({ success: false, error: error.message });
    }
}

const addOnCategoryPerMonth = async (amount, optionalAmount, accCategory, dateString, operation = 'add') => {
    try{
        const today = new Date(dateString);
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');

        if (optionalAmount.length === 1 && optionalAmount[0] === ''){
            const [category, subcategory] = accCategory[0].split('|');
            const float_amount = parseFloat(amount)

            const docRef = db.collection('CategoryPerMonth').doc(`${month}-${year}`).collection('collectedCategory').doc(category)

            const docSnapshot = await docRef.get()
            const existingAmount = docSnapshot.exists ? parseFloat(docSnapshot.data()[subcategory] || 0) : 0

            const newAmount = operation === 'subtract' ? existingAmount - float_amount : existingAmount + float_amount
            const data = { [subcategory]: newAmount < 0 ? 0 : newAmount };

            await docRef.set(data, {merge: true})
            
        }else{
            for (let i = 0; i< accCategory.length; i++){
                const [category, subcategory] = accCategory[i].split('|')
                const subAmount = parseFloat(optionalAmount[i]);

                const docRef = db.collection('CategoryPerMonth').doc(`${month}-${year}`).collection('collectedCategory').doc(category)

                const docSnapshot = await docRef.get()
                const existingAmount = docSnapshot.exists ? parseFloat(docSnapshot.data()[subcategory] || 0) : 0

                const newAmount = operation === 'subract' ? existingAmount - subAmount : existingAmount + subAmount
                const data = { [subcategory]: newAmount < 0 ? 0 : newAmount};

                await docRef.set(data, {merge: true})
            }
        }
    }catch(error){
        console.log(`Error on addOnCategoryPerMonth(editor controller) ${error}`)
    }
}

// const addOnClusterAmount = async (amount, cluster, dateString, operation='add') => {
//     try{
//         const float_amount = parseFloat(amount)

//         const date = new Date(dateString);
//         const year = date.getFullYear();
//         const month = String(date.getMonth() + 1).padStart(2, '0');

//         const clusterMapping = {
//             "501 COB": "COB",
//             "501 LFP": "LFP",
//             "501 CARP": "CARP",
//             "Contract Farming": "CF"
//         };

//         const cluster_mapped = clusterMapping[cluster]

//         const docRef = db.collection('AmountRecord').doc(`${year}-${month}`)
//         const docSnapshot = await docRef.get()
//         const existing_amount = docSnapshot.exists ? parseFloat(docSnapshot.data()[cluster_mapped]) || 0 : 0

//         const newAmount = operation === 'subtract' ? existing_amount - float_amount : existing_amount + float_amount
//         const data = { [cluster_mapped]: newAmount < 0 ? 0 : newAmount };

//         await docRef.set(data, {merge: true})

//     }catch(error){
//         console.log(`Error on addOnClusterAmount (editor controller) ${error}`)
//     }
// }

module.exports = {
    createDV,
    getAccountCodes,
    deleteDV, 
    passDocument,
    updateDV,
    getFormData,
    getPermission,
    getNumberOfCopies,
    savePayeeData,
    getPayeeData
};
