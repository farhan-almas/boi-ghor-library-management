const express=require('express');
const router=express.Router();
const ctrl=require('../controllers/departmentsController');
const {authenticate,requireAdmin}=require('../middleware/auth');
router.get('/',ctrl.getAllDepartments);
router.post('/',authenticate,requireAdmin,ctrl.createDepartment);
router.put('/:id',authenticate,requireAdmin,ctrl.updateDepartment);
router.delete('/:id',authenticate,requireAdmin,ctrl.deleteDepartment);
module.exports=router;
