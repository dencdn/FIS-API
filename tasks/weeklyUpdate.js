const {db} = require('../config/firebase')
const cron = require('node-cron')

// "55 23 * * 6"
const updateWeeklyRecords = async () => {
    cron.schedule("55 23 * * 6", async () => {
        try{
            const colRef = await db.collection('ControlBook').select('weekFO', 'weekRO').get()
            const date = new Date().toISOString().split('T')[0]
            const weekNum = getWeek(new Date(date))
            const currentWeekFO = `week${weekNum}FO`
            const currentWeekRO = `week${weekNum}RO`
            await Promise.all(
                colRef.docs.map(async (doc) => {
                    const data = doc.data()
                    const weekFO = Number(data.weekFO || 0)
                    const weekRO = Number(data.weekRO || 0)

                    const batch = db.batch()
                    batch.update(doc.ref, {
                        weekFO: 0,
                        weekRO: 0,
                        [currentWeekFO]: weekFO,
                        [currentWeekRO]: weekRO
                    })

                    const fieldOfficesRef = doc.ref.collection('FieldOffices');
                    const fieldOfficesSnap = await fieldOfficesRef.select('weekFO', 'weekRO').get();
                    if(!fieldOfficesSnap.empty){
                        fieldOfficesSnap.docs.forEach((subDoc) => {
                            const subData = subDoc.data()
                            const weekFO = Number(subData.weekFO || 0)
                            const weekRO = Number(subData.weekRO || 0)

                            batch.update(subDoc.ref, {
                                weekFO: 0,
                                weekRO: 0,
                                [currentWeekFO]: weekFO,
                                [currentWeekRO]: weekRO
                            })

                        })
                    }
                    await batch.commit()
                    console.log(`Successfully updated weekly ControlBook and FieldOffices for document ${doc.id}`);
                })
            )

        }catch(err){
            console.log('error on updating weekly: ', err)
        }
    })
}

const getWeek = (date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const dayOfWeek = startOfMonth.getDay();

    return Math.ceil((dayOfMonth + dayOfWeek) / 7);

}

module.exports = {updateWeeklyRecords}