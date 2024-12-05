const {db} = require('../config/firebase')
const cron = require('node-cron')

const updateControlBook = () => {
    cron.schedule('0 0 1 * *', async () => {
        try{
            const colRef = await db.collection('ControlBook')
            .select('prevMonthFO', 'prevMonthRO', 'thisMonthFO', 'thisMonthRO')
            .get();

            if(colRef.empty){
                return;
            }

            await Promise.all(
                colRef.docs.map(async (doc) => {
                    const data = doc.data();
                    const prevMonthFO_value = Number(data.prevMonthFO || 0)
                    const prevMonthRO_value = Number(data.prevMonthRO || 0)
                    const thisMonthFO_value = Number(data.thisMonthFO || 0)
                    const thisMonthRO_value = Number(data.thisMonthRO || 0)

                    const batch = db.batch();

                    batch.update(doc.ref, {
                        prevMonthFO: prevMonthFO_value + thisMonthFO_value,
                        prevMonthRO: prevMonthRO_value + thisMonthRO_value,
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
                    })

                    const fieldOfficesRef = doc.ref.collection('FieldOffices');
                    const fieldOfficesSnap = await fieldOfficesRef.select('prevMonthFO', 'prevMonthRO', 'thisMonthFO', 'thisMonthRO').get();
                    if(!fieldOfficesSnap.empty){
                        fieldOfficesSnap.docs.forEach((subDoc) => {
                            const subData = subDoc.data()
                            const subPrevMonthFO = Number(subData.prevMonthFO || 0);
                            const subPrevMonthRO = Number(subData.prevMonthRO || 0);
                            const subThisMonthFO = Number(subData.thisMonthFO || 0);
                            const subThisMonthRO = Number(subData.thisMonthRO || 0);

                            batch.update(subDoc.ref, {
                                prevMonthFO: subPrevMonthFO + subThisMonthFO,
                                prevMonthRO: subPrevMonthRO + subThisMonthRO,
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
                            });
                        })
                    }
                    await batch.commit()
                    console.log(`Successfully updated ControlBook and FieldOffices for document ${doc.id}`);
                })
            )
            console.log('All updates completed successfully.');
        }catch(err){
            console.log('error updating control book', err)
        }
    })
    
}


module.exports = {updateControlBook}