const express = require('express');
const router = express.Router();
const upload = require('../config/upload');

const productController = require('../controllers/productController')

router.get('/', productController.getAllProducts)
router.get('/add', productController.showAddForm)
router.post('/add', upload.single('url_image'), productController.addProduct)

router.get('/edit/:id', productController.showEditForm)
router.post('/edit/:id', upload.single('url_image'), productController.updateProduct)

router.get('/delete/:id', productController.deleteProduct);

module.exports = router;