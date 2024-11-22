const {admin, db}  = require('../config/firebase')

const getAllAccounts = async (req, res) => {
    try{
      const users = await listAllUsers(); // Call the function to get users
      res.status(200).json(users);
    }catch(error){
      res.status(500).json({ error: 'Failed to list users' });
    }
  }
  
  const listAllUsers = async(nextPageToken) => {
    let allUsers = []; 
  
    const fetchUsers = async (nextPageToken) => {
      try {
        const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
  
        allUsers = allUsers.concat(listUsersResult.users.map(userRecord => userRecord.toJSON()));
  
        if (listUsersResult.pageToken) {
          return fetchUsers(listUsersResult.pageToken); 
        } else {
          return allUsers; 
        }
      } catch (error) {
        console.error('Error listing users:', error);
        throw error; 
      }
    };
  
    return await fetchUsers(nextPageToken);
  }

  const disableAccount = async(req, res) => {
    const uid = req.params.id
    const {flag} = req.body

    try {
      const user = await admin.auth().updateUser(uid, {
        disabled: flag
      })
      res.status(200).json({message: flag ? "User successfully disabled" : "User succesfully enabled", user: user.toJSON()})
      
    } catch (error) {
      res.status(500).json({ error: 'Failed to disable Account' });
    }
  }

  const createAccount = async (req, res) => {


    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        
        return res.status(406).json({ success: false, message: 'Unauthorized: no token provided' });
    }
    const token = authHeader.split(' ')[1];
  
    const decodedToken = await admin.auth().verifyIdToken(token);
    const role = req.body.role;
    const dispName = req.body.name
    
    const email = decodedToken.email
    const uid = decodedToken.uid
  

    const userData = {
      uid : uid,
      name : dispName,
      email: email,
      role : role
    }
  
    try{
       await admin.auth().setCustomUserClaims(uid, { role, dispName });
  
       await db.collection('listOfUsers').doc(uid).set(userData);
       
      
       return res.status(200).json({ 
        success: true, 
        message: `User created successfully with role ${role}` 
        
      });
    }catch(error){
      console.error('Error creating new user:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error creating user', 
        error: error.message 
      });
    }
  }

  const deleteAcc = async(req, res) => {
    const uid = req.params.id
    
    try {
      await admin.auth().deleteUser(uid)
      await db.collection('listOfUsers').doc(uid).delete()
      res.status(200).json({message: 'Account Successfully Deleted'})
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error deleting user', 
        error: error.message 
      });
    }
  }

  const retrieveRoles = async(req, res) => {
    try{
      const docref = await db.collection('Roles').get()

      const roles = docref.docs.map(doc => ({
        ...doc.data()
      }));

      res.status(200).json(roles)
    }catch(error){
      console.error('Error retrieving roles:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error retrieving roles', 
        error: error.message 
      });
    }
  }

  const changeAccess = async(req, res) => {
    const roleName = req.params.id
    const {newPermission} = req.body
    try {
      await db.collection('Roles').doc(roleName).update({
        permission: newPermission
      })
      res.status(200).json({message: 'Permission Change'})
    }catch(error){
      console.error('Error changing permission:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error changing permission', 
        error: error.message 
      });
    }
  }

  const deleteRequest = async(req, res) => {
    const id = req.params.id
    try {
      const request = db.collection('resetPasswordRequest').doc(id)
      await request.delete()
      res.status(200).json({message: 'Request successfully updated'})

    } catch (error) { 
      console.error('Error updating request status:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error updating request status:', 
        error: error.message 
      });
    }
  }

  module.exports = {
    getAllAccounts,
    disableAccount,
    createAccount,
    deleteAcc,
    retrieveRoles,
    changeAccess,
    deleteRequest
  };