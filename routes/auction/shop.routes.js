const express = require('express');
const userCtrl = require('../../controllers/auction/user.controller');
const authCtrl = require('../../controllers/auction/auth.controller');
const shopCtrl = require('../../controllers/auction/shop.controller');

const router = express.Router();

router.route('/shops').get(shopCtrl.list);

router.route('/shop/:shopId').get(shopCtrl.read);

router
  .route('/shops/by/:userId')
  .post(
    authCtrl.requireSignin,
    authCtrl.hasAuthorization,
    userCtrl.isSeller,
    shopCtrl.create
  )
  .get(authCtrl.requireSignin, authCtrl.hasAuthorization, shopCtrl.listByOwner);

router
  .route('/shops/:shopId')
  .put(authCtrl.requireSignin, shopCtrl.isOwner, shopCtrl.update)
  .delete(authCtrl.requireSignin, shopCtrl.isOwner, shopCtrl.remove);

router.route('/shops/logo/:shopId').get(shopCtrl.photo, shopCtrl.defaultPhoto);

router.route('/shops/defaultphoto').get(shopCtrl.defaultPhoto);

router.param('shopId', shopCtrl.shopByID);
router.param('userId', userCtrl.userByID);

module.exports = router;
