
const {admin, db}  = require('../config/firebase')
require('dotenv').config();
const fs = require('fs');
const FieldValue = admin.firestore.FieldValue;

const {
    setHistoryLogs,
    getDateTime
  } = require('./MultiAccess/Functions')

const getAllLogs = async(req, res) => {
  try{
    const docRef = db.collection('passed_records').doc('History_Logs')
    const data = await docRef.get();

    const arrLogs = []

    if(data.exists){
      const logs = data.data()

      for(const key in logs){
        arrLogs.push(logs[key])
      }
      res.status(200).json(arrLogs);
    }
    else{
      console.log('No History Logs Founds')
    }  
  }
  catch(error){
    console.error("Error retrieving documents: ", error);
    res.status(500).json({ success: false, error: error.message });
  } 
}

// const uploadJSOn = async () => {
//   try {
//     const data = JSON.parse(fs.readFileSync('C:/Users/Administrator/Downloads/assests1.json', 'utf8'));
//     const docRef = db.collection('account_codes').doc('accountFields_1');
//     const transformedData = {};
//     Object.keys(data).forEach(key => {
//         const concatenatedValue = `${data[key].col.join(':')}:${data[key].account_title}`;

//         transformedData[key] = concatenatedValue;
//     });
//     await docRef.set(transformedData);

//     console.log('Data written successfully as a single document with multiple fields.');
// } catch (error) {
//     console.error(`Failed to write data: ${error}`);
// }
// }

// const readAdmin_records = async(req, res) => {
//   try {
//       const documents = {};
     
//       const recordsSnapshot = await db.collection('records')
//           .where('status', '==', 'For Approval')
//           .get();
      
//       recordsSnapshot.forEach((recordDoc) => {
//           if(recordDoc.exists){
//               const recordData = recordDoc.data();
//               documents[recordDoc.id] = {
//                   data: recordData,
//               }
              
//           }else{
//               console.log(`No such document for keys`);
//           }
//       })
//       res.status(200).json(documents);
//   } catch (error) {
//       console.log(`Error retrieving passed records: ${error}`);
//       res.status(404).json({ message: "Not Found" });
//   }
  
// }


// FUND CLUSTER
const addFundCluster = async (req, res) => {
  const newFundCluster = req.body.cluster
  const randomKey = req.body.key

  const clusterData = {
    [randomKey] : newFundCluster
  }

  try{
    const docRef = db.collection('formData').doc('fundCluster');
    const doc = await docRef.get()
    if(doc.exists){
      await docRef.update(clusterData)
    }else{
      await docRef.set(clusterData)
    }
    return res.status(200).json({success: true, message: `Successfully added ${newFundCluster}`});

  }catch(error){
    console.log('error adding new fundcluster')
    return res.status(500).json({ 
      success: false, 
      message: 'Error adding cluster', 
      error: error.message 
    });
  }
}

const getFundCluster = async (req, res) => {
  try{
    const docRef = db.collection('formData').doc('fundCluster');
    const data = await docRef.get();

    if(data.exists){
      const cluster = data.data()

      res.status(200).json({formData: cluster});
    }
    else{
      console.log('No Fund cluster found')
    } 

  }catch(error){
    console.error("Error retrieving fund cluster: ", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

const deleteFundCluster = async (req, res) => {
  try{
    const field_key = req.params.field_key;

    const docRef = db.collection('formData').doc('fundCluster');

    await docRef.update({
      [field_key]: FieldValue.delete()
    });

    res.status(200).json({ success: true, message: `Deleted key: ${field_key}` });

  }catch(error){
    console.log(`Error in deleting fund ${error}`)
    res.status(500).json({ success: false, error: error.message });
  }
}

// RESPONSIBILITY CENTER
const addRC = async (req, res) => {
  const newRC = req.body.RC
  const randomKey = req.body.key

  const rcData = {
    [randomKey] : newRC
  }

  try{
    const docRef = db.collection('formData').doc('ResponsibilityCenter');
    const doc = await docRef.get()
    if(doc.exists){
      await docRef.update(rcData)
    }else{
      await docRef.set(rcData)
    }
    return res.status(200).json({success: true, message: `Successfully added ${newRC}`});

  }catch(error){
    console.log('error adding new RC')
    return res.status(500).json({ 
      success: false, 
      message: 'Error creating RC', 
      error: error.message 
    });
  }
}

const getRC = async (req, res) => {
  try{
    const docRef = db.collection('formData').doc('ResponsibilityCenter');
    const data = await docRef.get();

    if(data.exists){
      const RC = data.data()

      res.status(200).json({formData: RC});
    }
    else{
      console.log('No RC found')
    } 

  }catch(error){
    console.error("Error retrieving RC ", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

const deleteRC = async (req, res) => {
  try{
    const field_key = req.params.field_key;

    const docRef = db.collection('formData').doc('ResponsibilityCenter');

    await docRef.update({
      [field_key]: FieldValue.delete()
    });

    res.status(200).json({ success: true, message: `Deleted key: ${field_key}` });

  }catch(error){
    console.log(`Error in deleting fund ${error}`)
    res.status(500).json({ success: false, error: error.message });
  }
}

//NAME AND OFFICE
const addNameAndOffice = async (req, res) => {
  try{
    const {name, office, key} = req.body
    const data = {
      [key] : [name, office]
    }
    const docRef = db.collection('formData').doc('NameOffice');
    const doc = await docRef.get()
    if(doc.exists){
      await docRef.update(data)
    }else{
      await docRef.set(data)
    }
    return res.status(200).json({success: true, message: `Successfully added ${data}`});
    
  }catch(error){
    console.log(`Error in adding new name and office ${error}`)
    res.status(500).json({ success: false, error: error.message });
  }
}

const getNameAndOffice = async (req, res) => {
  try{
    const docRef = db.collection('formData').doc('NameOffice');
    const data = await docRef.get();

    if(data.exists){
      const RC = data.data()

      res.status(200).json({formData: RC});
    }
    else{
      console.log('No name and office found')
    } 
  }catch(error){
    console.error("Error retrieving name and office ", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

const deleteNameAndOffice = async (req, res) => {
  try{
    const field_key = req.params.field_key;

    const docRef = db.collection('formData').doc('NameOffice');

    await docRef.update({
      [field_key]: FieldValue.delete()
    });

    res.status(200).json({ success: true, message: `Deleted key: ${field_key}` });

  }catch(error){
    console.log(`Error in deleting fund ${error}`)
    res.status(500).json({ success: false, error: error.message });
  }
}

//TAX TYPE
const addTaxType = async(req, res) => {
  try{
    const {tax, title, formula1, formula2, key} = req.body
    const data = {
      [key] : [tax, title, formula1, formula2]
    }
    const docRef = db.collection('formData').doc('TaxType');
    const doc = await docRef.get()
    if(doc.exists){
      await docRef.update(data)
    }else{
      await docRef.set(data)
    }
    return res.status(200).json({success: true, message: `Successfully added tax ${data}`});
    
  }catch(error){
    console.log(`Error in adding new tax ${error}`)
    res.status(500).json({ success: false, error: error.message });
  }
}

const getTaxType = async (req, res) => {
  try{
    const docRef = db.collection('formData').doc('TaxType');
    const data = await docRef.get();

    if(data.exists){
      const tax = data.data()

      res.status(200).json({formData: tax});
    }
    else{
      console.log('No tax type found')
    } 
  }catch(error){
    console.error("Error retrieving name and office ", error);
    res.status(500).json({ success: false, error: error.message });
  }
}

const deleteTax = async (req, res) => {
  try{
    const field_key = req.params.field_key;

    const docRef = db.collection('formData').doc('TaxType');

    await docRef.update({
      [field_key]: FieldValue.delete()
    });

    res.status(200).json({ success: true, message: `Deleted key: ${field_key}` });

  }catch(error){
    console.log(`Error in deleting fund ${error}`)
    res.status(500).json({ success: false, error: error.message });
  }
}

const approveDV = async(req, res) => {
  const DV = req.params.id
  const dispName = req.user.name;
  const {payee, amount, fund, date, optionalAmount, accCategory}= req.body.data

  const dateTimeCollection = getDateTime();
  const logs = `${payee}!${DV}!Approved By ${dispName}!${dateTimeCollection}!Approved`

  try{
    const docRef = db.collection('records').doc(DV);
    
    const docSnapshot = await docRef.get();
    if (!docSnapshot.exists) {
      return res.status(404).json({ message: 'Document not found' });
    }

    await docRef.update({
      approvedBy: dateTimeCollection,
      status: 'Approved',
    });
    await setHistoryLogs(dateTimeCollection, logs)
    await addOnClusterAmount(amount, fund, date)
    await addOnCategoryPerMonth(amount, optionalAmount, accCategory, date)
    
    res.status(200).json({message: 'Document Approved Successfully'})
  }catch(error){
    console.log('Error Approving Document',error)
    res.status(500).json({ success: false, error: error.message });
  }
}

const addOnClusterAmount = async (amount, cluster, dateString, operation='add') => {
  try{
      const float_amount = parseFloat(amount)

      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');

      const clusterMapping = {
          "501 COB": "COB",
          "501 LFP": "LFP",
          "501 CARP": "CARP",
          "Contract Farming": "CF"
      };

      const cluster_mapped = clusterMapping[cluster]
      const docRef = db.collection('AmountRecord').doc(`${year}-${month}`)
      const docSnapshot = await docRef.get()
      const existing_amount = docSnapshot.exists ? parseFloat(docSnapshot.data()[cluster_mapped]) || 0 : 0

      const newAmount = operation === 'subtract' ? existing_amount - float_amount : existing_amount + float_amount
      const data = { [cluster_mapped]: newAmount < 0 ? 0 : newAmount };

      await docRef.set(data, {merge: true})

  }catch(error){
      console.log(`Error on addOnClusterAmount (editor controller) ${error}`)
  }
}

const addOnCategoryPerMonth = async (amount, optionalAmount, accCategory, dateString, operation = 'add') => {
  try{
      const today = new Date(dateString);
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');

      const docRef = db.collection('MonthCategory').doc(`${year}-${month}`);

      if (optionalAmount.length === 1 && optionalAmount[0] === ''){
          const [category, subcategory] = accCategory[0].split('|');
          const fieldKey = `${category}|${subcategory}`;
          const float_amount = parseFloat(amount)

          const docSnapshot = await docRef.get();
          const existingData = docSnapshot.exists ? docSnapshot.data() : {};
          const existingAmount = parseFloat(existingData[fieldKey] || 0);

          const newAmount = operation === 'subtract' ? existingAmount - float_amount : existingAmount + float_amount
          await docRef.set({ [fieldKey]: newAmount < 0 ? 0 : newAmount }, { merge: true });
          
      }else{
          const updates = {};
          for (let i = 0; i< accCategory.length; i++){
              const [category, subcategory] = accCategory[i].split('|')
              const fieldKey = `${category}|${subcategory}`;
              const subAmount = parseFloat(optionalAmount[i]);

              const docSnapshot = await docRef.get()
              const existingData = docSnapshot.exists ? docSnapshot.data() : {}
              const existingAmount = parseFloat(existingData[fieldKey] || 0);

              const newAmount = operation === 'subract' ? existingAmount - subAmount : existingAmount + subAmount
              updates[fieldKey] = newAmount < 0 ? 0 : newAmount;
          }
          await docRef.set(updates, { merge: true });
      }
  }catch(error){
      console.log(`Error on addOnCategoryPerMonth(editor controller) ${error}`)
  }
}

const getNumberOfRecords = async (req, res) => {
  try{
    const year = new Intl.DateTimeFormat('en-PH', {year: 'numeric'}).format(new Date())
    const docRef = db.collection('NumberOfRecords').doc(year.toString())
    const data = await docRef.get()
    if(data.exists){
      const totalRecords = data.data()
      res.status(200).json({records: totalRecords})
    }else{
      console.log(`year ${year} is not found`)
    } 
  }catch(error){
    console.log('error on getting number of records', error)
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getAllLogs,
  //readAdmin_records,
  addFundCluster,
  getFundCluster,
  deleteFundCluster,
  addRC,
  getRC,
  deleteRC,
  addNameAndOffice,
  getNameAndOffice,
  deleteNameAndOffice,
  addTaxType,
  getTaxType,
  deleteTax,
  approveDV,
  getNumberOfRecords
};
