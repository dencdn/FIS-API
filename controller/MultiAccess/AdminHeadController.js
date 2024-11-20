const {admin, db}  = require('../../config/firebase')
require('dotenv').config();
const axios = require('axios');

const getForecastedValues = async(req, res) => {
    try{
      const awsAPI_URL = process.env.AWS_API_URL
      const data = {
        steps: 12
      }
      const response = await axios.post(`${awsAPI_URL}/forecast`, data);
      res.status(200).json(response.data)
    }catch(error){
      console.log('error getting forecasted values', error)
      res.status(500)
    }
}

const getPercentageForMonth = async(req, res) => {
  try{
    const {year, month} = req.body
    const colRef = db.collection('CategoryPerMonth').doc(`${month}-${year}`).collection('collectedCategory')
    const colSnapshot = await colRef.get()

    const categoryData = {}
    if(colSnapshot.empty){
      console.log('No matching documents.');
      return res.status(404).json(categoryData)
    }

    colSnapshot.forEach((doc) => {
      categoryData[doc.id] = doc.data()
    })

    res.status(200).json(categoryData)

  }catch(error){
    console.log('error getting percentage for this month', error)
    res.status(500)
  }
}

const sendTestExpense = async (req, res) => {
  try{
    const awsAPI_URL = process.env.AWS_API_URL
    const {frequency, expense, steps} = req.body
    const data = {
      frequency: frequency,
      new_expense: expense,
      steps: steps
    }
    const response = await axios.post(`${awsAPI_URL}/test-forecast`, data);
    res.status(200).json(response.data)
  }catch(error){
    console.log('error sending test expense', error)
    res.status(500)
  }
}

module.exports = {
    getForecastedValues,
    getPercentageForMonth,
    sendTestExpense
}
