require('dotenv').config()

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser');

const requireAuth = require('./middleware/requireAuth');
const AdminRoutes = require('./routes/AdminRoutes');
const UserRoutes = require('./routes/UserRoutes')
const EditorRoutes = require('./routes/EditorRoutes')
const OperatorRoutes = require('./routes/OperatorRoutes')
const HeadRoutes = require('./routes/HeadRoutes')
const SuperAdminRoutes = require('./routes/SuperAdminRoutes')
const AdminAndHeadRoutes = require('./routes/Admin_Head_routes')
const EditorOperatorRouter = require('./routes/editorOperatorRoutes')

const app = express()

app.use(cors({
  origin: 'https://niafis.com',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], 
  credentials: true
}))

app.use(cookieParser())
app.use(express.json())
app.use((req, res, next) => {
   next() 
})

app.options('*', cors());

app.get('/status', (req, res) => {
  res.status(200).json({
      status: 'success',
      message: 'Service is up and running!',
      timestamp: new Date().toISOString()
  });
});

app.get('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.status(200).json({message: "cleared"})
})

const setNotification = async(uids, email, dateTime) => {
  try {
    for (const uid of uids){
      const notificationRef = rtdb.ref(`users/${uid}/notifications`);
      await notificationRef.push({
          message: `A new password reset request has been submitted for the email: ${email}`,
          email: email,
          requestedAt: dateTime,
          read: false,
      });
  }
  } catch (error) {
    
  }
}

app.post('/forgotpassword', async(req, res) => {
  const email = req.body.email

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
      email: email,
      requestedAt: dateTimeCollection,
      status: 'Pending'
    }
  try {

    await db.collection('resetPasswordRequest').doc().set(data)
    const superAdminUID = await getUsers('0')
    await setNotification(superAdminUID, email, dateTimeCollection)
    res.status(200).json({message: 'Request is successfully sent'})
  } catch (error) {
    res.status(200).json({error: `Error requesting to reset password: ${error}`})
  }
})

app.use('/user',UserRoutes)

app.use(requireAuth)

app.use('/admin', AdminRoutes)
app.use('/editor', EditorRoutes)
app.use('/operator', OperatorRoutes)
app.use('/head', HeadRoutes)
app.use('/superadmin', SuperAdminRoutes)
app.use('/adminhead', AdminAndHeadRoutes)
app.use('/editoroperator', EditorOperatorRouter)

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
