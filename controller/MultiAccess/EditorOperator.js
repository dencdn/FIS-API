const {admin, db}  = require('../../config/firebase')
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

module.exports = {
    getNumberOfCopies
}