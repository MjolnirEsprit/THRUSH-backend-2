const express = require('express');
const userCtrl = require('../../controllers/auction/user.controller');
const authCtrl = require('../../controllers/auction/auth.controller');
const auctionCtrl = require('../../controllers/auction/auction.controller');

const router = express.Router();

router.route('/auctions').get(auctionCtrl.listOpen);

router.route('/auctions/bid/:userId').get(auctionCtrl.listByBidder);

router.route('/auction/:auctionId').get(auctionCtrl.read);

router
  .route('/auctions/by/:userId')
  .post(
    authCtrl.requireSignin,
    authCtrl.hasAuthorization,
    userCtrl.isSeller,
    auctionCtrl.create
  )
  .get(
    authCtrl.requireSignin,
    authCtrl.hasAuthorization,
    auctionCtrl.listBySeller
  );

router
  .route('/auctions/:auctionId')
  .put(authCtrl.requireSignin, auctionCtrl.isSeller, auctionCtrl.update)
  .delete(authCtrl.requireSignin, auctionCtrl.isSeller, auctionCtrl.remove);

router
  .route('/auctions/image/:auctionId')
  .get(auctionCtrl.photo, auctionCtrl.defaultPhoto);

router.route('/auctions/defaultphoto').get(auctionCtrl.defaultPhoto);

router.param('auctionId', auctionCtrl.auctionByID);
router.param('userId', userCtrl.userByID);

module.exports = router;
