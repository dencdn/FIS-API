require('dotenv').config()

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser');
const {admin, db, rtdb}  = require('./config/firebase');
const http = require('http');


const {updateControlBook} = require('./tasks/monthlyUpdate')
const {updateASADue} = require('./tasks/dailyUpdate')
const {updateWeeklyRecords} = require('./tasks/weeklyUpdate')

const requireAuth = require('./middleware/requireAuth');
const AdminRoutes = require('./routes/AdminRoutes');
const UserRoutes = require('./routes/UserRoutes')
const EditorRoutes = require('./routes/EditorRoutes')
const OperatorRoutes = require('./routes/OperatorRoutes')
const HeadRoutes = require('./routes/HeadRoutes')
const SuperAdminRoutes = require('./routes/SuperAdminRoutes')
const AdminAndHeadRoutes = require('./routes/Admin_Head_routes')
const EditorOperatorRouter = require('./routes/editorOperatorRoutes')

const initializeSockets = require('./sockets/index');
const { getUsers } = require('./controller/MultiAccess/Functions')

const app = express()
const server = http.createServer(app) //create an instance of http server

app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.use(cookieParser())
app.use(express.json())
app.use((req, res, next) => {
   next() 
})

app.options('*', cors());

app.get('/logout', (req, res) => {
  res.clearCookie('token', { 
    path: '/', 
    httpOnly: true, 
    secure: true, 
    sameSite: 'None'
   });
  res.status(200).json({message: "cleared"})
})

app.get('/status', (req, res) => {
  res.status(200).json({
      status: 'success',
      message: 'Service is up and running!',
      timestamp: new Date().toISOString()
  });
});

updateControlBook()
updateASADue()
updateWeeklyRecords()

app.use('/user',UserRoutes)

app.use(requireAuth)

app.use('/admin', AdminRoutes)
app.use('/editor', EditorRoutes)
app.use('/operator', OperatorRoutes)
app.use('/head', HeadRoutes)
app.use('/superadmin', SuperAdminRoutes)
app.use('/adminhead', AdminAndHeadRoutes)
app.use('/editoroperator', EditorOperatorRouter)

initializeSockets(server);
const PORT = process.env.PORT;
server.listen(PORT, () => {
  // instead of app.listen use the server instance
  // app is a shortcut provided by the Express
  // serve isntance requires to bind websocket
  console.log(`Server running on port ${PORT}`);
});
