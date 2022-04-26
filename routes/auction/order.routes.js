const express = require('express');
const orderCtrl = require('../../controllers/auction/order.controller');
const productCtrl = require('../../controllers/auction/product.controller');
const authCtrl = require('../../controllers/auction/auth.controller');
const shopCtrl = require('../../controllers/auction/shop.controller');
const userCtrl = require('../../controllers/auction/user.controller');

const router = express.Router();

router
  .route('/orders/:userId')
  .post(
    authCtrl.requireSignin,
    userCtrl.stripeCustomer,
    productCtrl.decreaseQuantity,
    orderCtrl.create
  );

router
  .route('/orders/shop/:shopId')
  .get(authCtrl.requireSignin, shopCtrl.isOwner, orderCtrl.listByShop);

router
  .route('/orders/user/:userId')
  .get(authCtrl.requireSignin, orderCtrl.listByUser);

router.route('/order/status_values').get(orderCtrl.getStatusValues);

router
  .route('/order/:shopId/cancel/:productId')
  .put(
    authCtrl.requireSignin,
    shopCtrl.isOwner,
    productCtrl.increaseQuantity,
    orderCtrl.update
  );

router
  .route('/order/:orderId/charge/:userId/:shopId')
  .put(
    authCtrl.requireSignin,
    shopCtrl.isOwner,
    userCtrl.createCharge,
    orderCtrl.update
  );

router
  .route('/order/status/:shopId')
  .put(authCtrl.requireSignin, shopCtrl.isOwner, orderCtrl.update);

router.route('/order/:orderId').get(orderCtrl.read);

router.param('userId', userCtrl.userByID);
router.param('shopId', shopCtrl.shopByID);
router.param('productId', productCtrl.productByID);
router.param('orderId', orderCtrl.orderByID);

module.exports = router;
