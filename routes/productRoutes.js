const express = require('express');
const productController = require('./../controllers/productsController');
const authController = require('./../controllers/authController');

const router = express.Router();

router
  .route('/top-5-cheap')
  .get(productController.aliasTopProducts, productController.getAllProducts);

router.route('/product-stats').get(productController.getProductStats);
router.route('/monthly-plan/:year').get(productController.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, productController.getAllProducts)
  .post(productController.createProduct);

router
  .route('/:id')
  .get(productController.getProduct)
  .patch(productController.updateProduct)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    productController.deleteProduct
  );

module.exports = router;
