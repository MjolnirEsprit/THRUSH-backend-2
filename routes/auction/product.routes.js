const express = require('express');
const productCtrl = require('../../controllers/auction/product.controller');
const authCtrl = require('../../controllers/auction/auth.controller');
const shopCtrl = require('../../controllers/auction/shop.controller');

const router = express.Router();

router
  .route('/api/products/by/:shopId')
  .post(authCtrl.requireSignin, shopCtrl.isOwner, productCtrl.create)
  .get(productCtrl.listByShop);

router.route('products/latest').get(productCtrl.listLatest);

router.route('/products/related/:productId').get(productCtrl.listRelated);

router.route('/products/categories').get(productCtrl.listCategories);

router.route('/products').get(productCtrl.list);

router.route('/products/:productId').get(productCtrl.read);

router
  .route('/product/image/:productId')
  .get(productCtrl.photo, productCtrl.defaultPhoto);
router.route('/product/defaultphoto').get(productCtrl.defaultPhoto);

router
  .route('/product/:shopId/:productId')
  .put(authCtrl.requireSignin, shopCtrl.isOwner, productCtrl.update)
  .delete(authCtrl.requireSignin, shopCtrl.isOwner, productCtrl.remove);

router.param('shopId', shopCtrl.shopByID);
router.param('productId', productCtrl.productByID);

module.exports = router;
