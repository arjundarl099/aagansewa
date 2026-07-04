const express = require('express');
const router  = express.Router();
const { getAllUsers, getUser, updateUser, deleteUser } = require('../Controllers/userController');
const { protect, authorize } = require('../middleware/auth'); // ✅ authorize, not adminOnly

router.use(protect);
router.use(authorize('admin')); // ✅ pass 'admin' role

router.get('/',      getAllUsers);
router.get('/:id',   getUser);
router.put('/:id',   updateUser);
router.delete('/:id', deleteUser);

module.exports = router;