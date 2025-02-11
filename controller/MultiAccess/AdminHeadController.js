const {admin, db}  = require('../../config/firebase')
require('dotenv').config();
const axios = require('axios');

const getForecastedValues = async(req, res) => {
    try{
      const awsAPI_URL = process.env.AWS_API_URL
      // const awsAPI_URL = 'http://10.1.50.91:8000'
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
    const {month, year, amount} = req.body
    const awsAPI_URL = process.env.AWS_API_URL
    const data = {
      month: month,
      year: year,
      amount: amount
    }
    const response = await axios.post(`${awsAPI_URL}/clasify`, data);
    res.status(200).json(response.data)

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

const getRecords = async(req, res) => {
  try {
    const awsAPI_URL = process.env.AWS_API_URL
    const response = await axios.get(`${awsAPI_URL}/records`);
    res.status(200).json(response.data)
  } catch(error) {
    console.log('error sending records', error)
    res.status(500)
  }
}

module.exports = {
    getForecastedValues,
    getPercentageForMonth,
    sendTestExpense,
    getRecords
}
