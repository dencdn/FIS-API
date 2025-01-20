
const {admin, db}  = require('../config/firebase')
require('dotenv').config();
const fs = require('fs');
const FieldValue = admin.firestore.FieldValue;
const path = require('path')
const XlsxPopulate = require('xlsx-populate');
const {toWords} = require('number-to-words')

const {
    setHistoryLogs,
    getDateTime,
    getUsers,
    setNotification,
    addComments
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

const downloadDV = async(req, res) => {
  const { data } = req.body

  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'DV.xlsx'); 
    const workbook = await XlsxPopulate.fromFileAsync(templatePath);

    //Computation
    const val1 = eval(data.amount + data.TT_formula1).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const val2 = eval(data.amount + data.TT_formula2).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const tval = parseFloat(val1.replace(/,/g, '')) + parseFloat(val2.replace(/,/g, ''))
    const total_val = tval.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const floatTotal_val = parseFloat(total_val.replace(/,/g, ''))
    
    const adue = data.amount - tval
    const amount_due = adue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const floatAmountDue = parseFloat(amount_due.replace(/,/g, ''))

    const combinedAccTitle = data.accTitle.join("\n");
    const combinedAccCode = data.accCode.join("\n");
    console.log(Object.keys(data.ASA).join('\n').replace(/\|/g, ' ').replace(/\//g, ' ').replace(/\,/g, ' '));
  
    const ASA = Object.keys(data.ASA).join("\r\n").replace(/\|/g, ' ').replace(/\//g, ' ').replace(/\,/g, ' ');

    //payee
    workbook.sheet('Sheet1').cell("P2").value(data.fund)
    workbook.sheet('Sheet1').cell("P4").value(convertDate(data.date))
    workbook.sheet('Sheet1').cell("P6").value(data.DV)
    workbook.sheet('Sheet1').cell("C11").value(data.payee)
    workbook.sheet('Sheet1').cell("K12").value(`${data.TT_tax} ${data.TIN}`)
    workbook.sheet('Sheet1').cell("P12").value(data.ORSBURS)
    workbook.sheet('Sheet1').cell("C13").value(data.address)
    workbook.sheet('Sheet1').cell("A16").value(data.particular)
    workbook.sheet('Sheet1').cell("K17").value(data.RC)
    workbook.sheet('Sheet1').cell("Q17").value(data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    workbook.sheet('Sheet1').cell("C28").value(ASA).style("wrapText", true)
    workbook.sheet('Sheet1').cell("C25").value(data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    workbook.sheet('Sheet1').cell("C26").value(data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    workbook.sheet('Sheet1').cell("E25").value(data.TT_formula1.replace(/\*/g, ' x ').replace(/\//g, ' / ').replace(/\+/g, ' + ').replace(/\-/g, ' - '))
    workbook.sheet('Sheet1').cell("E26").value(data.TT_formula2.replace(/\*/g, ' x ').replace(/\//g, ' / ').replace(/\+/g, ' + ').replace(/\-/g, ' - '))
    workbook.sheet('Sheet1').cell("G25").value(eval(data.amount + data.TT_formula1).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    workbook.sheet('Sheet1').cell("G26").value(eval(data.amount + data.TT_formula2).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    workbook.sheet('Sheet1').cell("Q25").value(total_val)
    workbook.sheet('Sheet1').cell("Q30").value(amount_due)
    workbook.sheet('Sheet1').cell("A36").value(data.NF_name)
    workbook.sheet('Sheet1').cell("A37").value(data.NF_office)
    workbook.sheet('Sheet1').cell("Q43").value(amount_due)
    workbook.sheet('Sheet1').cell("Q42").value(eval(data.amount + data.TT_formula1).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    workbook.sheet('Sheet1').cell("Q41").value(eval(data.amount + data.TT_formula2).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    workbook.sheet('Sheet1').cell("K45").value(`${toWords(floatAmountDue).charAt(0).toUpperCase() + toWords(floatAmountDue).slice(1)} pesos`)
    workbook.sheet('Sheet1').cell("B40").value(combinedAccTitle).style({
      wrapText: true, 
      verticalAlignment: "top",
    });
    workbook.sheet('Sheet1').cell("K40").value(combinedAccCode).style({
      wrapText: true, 
      verticalAlignment: "top",
    });
    workbook.sheet('Sheet1').cell("B41").value(`Due to BIR (${cutFormula(data.TT_formula1)})`)
    workbook.sheet('Sheet1').cell("B42").value(`Due to BIR (${cutFormula(data.TT_formula2)})`)

    //BIR
    workbook.sheet('Sheet1').cell("P81").value(data.fund)
    workbook.sheet('Sheet1').cell("P83").value(convertDate(data.date))
    workbook.sheet('Sheet1').cell("P91").value(data.ORSBURS)   
    workbook.sheet('Sheet1').cell("A95").value(data.birParticular)   
    workbook.sheet('Sheet1').cell("Q96").value(amount_due)   
    workbook.sheet('Sheet1').cell("Q109").value(amount_due)  
    workbook.sheet('Sheet1').cell("N119").value(eval(data.amount + data.TT_formula1).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    workbook.sheet('Sheet1').cell("N120").value(eval(data.amount + data.TT_formula2).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    workbook.sheet('Sheet1').cell("Q121").value(amount_due)
    workbook.sheet('Sheet1').cell("B119").value(`Due to BIR (${cutFormula(data.TT_formula1)})`)
    workbook.sheet('Sheet1').cell("B120").value(`Due to BIR (${cutFormula(data.TT_formula2)})`)  
    workbook.sheet('Sheet1').cell("A115").value(data.NF_name)
    workbook.sheet('Sheet1').cell("A116").value(data.NF_office)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=protected-template.xlsx');
    await workbook.outputAsync({ type: "nodebuffer" }).then(buffer => res.send(buffer));
  } catch (error) {
    console.log('error downloading DV', error)
    res.status(500).json({ success: false, error: error.message });
  }
}

const downloadGSIS = async(req, res) => {
  const { data } = req.body

  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'GSIS.xlsx'); 
    const workbook = await XlsxPopulate.fromFileAsync(templatePath);

    const combinedAccTitle = data.accTitle.join("\n");
    const combinedAccCode = data.accCode.join("\n");

    //GSIS computation
    const val1 = eval(data.amount + data.TT_formula1).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const gross_gsis = (parseFloat(data.amount) || 0) + (parseFloat(data.stamp) || 0) + (parseFloat(data.dst) || 0) + (parseFloat(data.vat12) || 0)
    const amountDue_gsis = gross_gsis - (parseFloat(val1) || 0)

    //payee
    workbook.sheet('Sheet1').cell("P2").value(data.fund)
    workbook.sheet('Sheet1').cell("P4").value(convertDate(data.date))
    workbook.sheet('Sheet1').cell("P6").value(data.DV)
    workbook.sheet('Sheet1').cell("C11").value(data.payee)
    workbook.sheet('Sheet1').cell("K12").value(`${data.TT_tax} ${data.TIN}`)
    workbook.sheet('Sheet1').cell("P12").value(data.ORSBURS)
    workbook.sheet('Sheet1').cell("C13").value(data.address)
    workbook.sheet('Sheet1').cell("B17").value(data.particular)
    workbook.sheet('Sheet1').cell("K17").value(data.RC)
    workbook.sheet('Sheet1').cell("Q17").value(gross_gsis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    // workbook.sheet('Sheet1').cell("D37").value(data.ASA.replace('|', ' ').replace('/', ' ').replace(',', ' '))
    workbook.sheet('Sheet1').cell("G23").value(data.amount)
    workbook.sheet('Sheet1').cell("G24").value(data.stamp)
    workbook.sheet('Sheet1').cell("G25").value(data.dst)
    workbook.sheet('Sheet1').cell("G26").value(data.vat12)
    workbook.sheet('Sheet1').cell("G27").value(gross_gsis)
    workbook.sheet('Sheet1').cell("G30").value(val1)
    workbook.sheet('Sheet1').cell("Q39").value(amountDue_gsis)
    workbook.sheet('Sheet1').cell("C30").value(data.amount)
    workbook.sheet('Sheet1').cell("A45").value(data.NF_name)
    workbook.sheet('Sheet1').cell("A46").value(data.NF_office)
    workbook.sheet('Sheet1').cell("N49").value(amountDue_gsis)
    workbook.sheet('Sheet1').cell("Q51").value(amountDue_gsis)
    workbook.sheet('Sheet1').cell("K53").value(`${toWords(amountDue_gsis).charAt(0).toUpperCase() + toWords(amountDue_gsis).slice(1)} pesos`)
    workbook.sheet('Sheet1').cell("B40").value(combinedAccTitle).style({
      wrapText: true, 
      verticalAlignment: "top",
    });
    workbook.sheet('Sheet1').cell("K40").value(combinedAccCode).style({
      wrapText: true, 
      verticalAlignment: "top",
    });
    // workbook.sheet('Sheet1').cell("B41").value(`Due to BIR (${cutFormula(data.TT_formula1)})`)
    // workbook.sheet('Sheet1').cell("B42").value(`Due to BIR (${cutFormula(data.TT_formula2)})`)

    //BIR
    // workbook.sheet('Sheet1').cell("P81").value(data.fund)
    // workbook.sheet('Sheet1').cell("P83").value(convertDate(data.date))
    // workbook.sheet('Sheet1').cell("P91").value(data.ORSBURS)   
    // workbook.sheet('Sheet1').cell("A95").value(data.birParticular)   
    // workbook.sheet('Sheet1').cell("Q96").value(amount_due)   
    // workbook.sheet('Sheet1').cell("Q109").value(amount_due)  
    // workbook.sheet('Sheet1').cell("N119").value(eval(data.amount + data.TT_formula1).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    // workbook.sheet('Sheet1').cell("N120").value(eval(data.amount + data.TT_formula2).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
    // workbook.sheet('Sheet1').cell("Q121").value(amount_due)
    // workbook.sheet('Sheet1').cell("B119").value(`Due to BIR (${cutFormula(data.TT_formula1)})`)
    // workbook.sheet('Sheet1').cell("B120").value(`Due to BIR (${cutFormula(data.TT_formula2)})`)  
    // workbook.sheet('Sheet1').cell("A115").value(data.NF_name)
    // workbook.sheet('Sheet1').cell("A116").value(data.NF_office)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=protected-template.xlsx');
    await workbook.outputAsync({ type: "nodebuffer" }).then(buffer => res.send(buffer));
  } catch (error) {
    console.log('error downloading DV', error)
    res.status(500).json({ success: false, error: error.message });
  }
}

const convertDate = (dateString) => {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

const cutFormula = (formula) => {
  let remainingString = "";

  for (let i = 0; i < formula.length; i++) {
    if (formula[i] === "*") {
      remainingString = formula.slice(i + 1); 
      break; 
    }
  }
  return parseFloat(remainingString) * 100 + '%'
}

const returnRecordTo = async(req, res) => {
  const {DV, payee, returnTo, remarks} = req.body;
  const dispName = req.user.name;

  console.log(req.body)
  
  const dateTimeCollection = getDateTime();
  const notifMessage1 = "The Disbursement Voucher for"
  const notifMessage2 = "has been returned by"
  const dataCollection = `${dateTimeCollection}|${payee}|${dispName}`
  const returnedBy = `${dispName}|${dateTimeCollection}`
  const comment = {dispName, remarks, dateTimeCollection}
  const logs = `${payee}!${DV}!Returned By ${dispName}!${dateTimeCollection}!Returned`
  
  try{
      await updateStatus(DV, returnedBy, returnTo)
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
      switch(returnToRole) {
        case '4':
          await docref.update({
            returnedToPreparer: dTPassed,
            status: returnType
          })
          break
        case '3':
          await docref.update({
            returnedToFunding: dTPassed,
            status: returnType
          }) 
          break
        case '2':
          await docref.update({
            returnedToBO: dTPassed,
            status: returnType
          })
          break
        default:
          break
      }
      const updatedDoc = await docref.get()
      return updatedDoc.data();
  }catch(error){
      console.log("error in updating", error)
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
  getNumberOfRecords,
  downloadDV,
  downloadGSIS,
  returnRecordTo
};
