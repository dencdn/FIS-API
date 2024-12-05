const {db} = require('../config/firebase')
const cron = require('node-cron')

const updateASADue = async () => {
    cron.schedule("0 0 * * *", async() => {
        try{
            const collectionRef = firestore.collection("ControlBook");
            const snapshot = await collectionRef
                            .where("sbStatus", "in", ["active", "disabled"])
                            .get();
            const today = new Date();
            const todayString = today.toISOString().split("T")[0];

            const batch = db.batch();

            snapshot.forEach((doc) => {
                const data = doc.data()
                const dueDate = data["endDate"]

                if(dueDate && new Date(dueDate).toISOString().split("T")[0] <= todayString){
                    const docRef = collectionRef.doc(doc.id);
                    batch.update(docRef, { cbStatus: "ended" });
                }
            })
            await batch.commit()

        }catch(err){
            console.log('Error on checking and updating control book collection: ', err)
        }
    })
}

module.exports = {updateASADue}