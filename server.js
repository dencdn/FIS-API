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
  origin: 'http://localhost:5173',
  credentials: true
}))

app.use(cookieParser())
app.use(express.json())
app.use((req, res, next) => {
   next() 
})
app.get('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.status(200).json({message: "cleared"})
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
