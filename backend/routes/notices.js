const express=require('express');
const router=express.Router();
const ctrl=require('../controllers/noticesController');
const {authenticate,requireAdmin}=require('../middleware/auth');
router.get('/',ctrl.getNotices);
router.post('/',authenticate,requireAdmin,ctrl.createNotice);
router.put('/:id',authenticate,requireAdmin,ctrl.updateNotice);
router.delete('/:id',authenticate,requireAdmin,ctrl.deleteNotice);
module.exports=router;
