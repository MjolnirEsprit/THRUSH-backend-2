const express = require('express');
const userCtrl = require('../../controllers/auction/user.controller');
const authCtrl = require('../../controllers/auction/auth.controller');

const router = express.Router();

router
  .route('/')
  .get(userCtrl.list)
  .post(userCtrl.create);

router
  .route('/:userId')
  .get(authCtrl.requireSignin, userCtrl.read)
  .put(authCtrl.requireSignin, authCtrl.hasAuthorization, userCtrl.update)
  .delete(authCtrl.requireSignin, authCtrl.hasAuthorization, userCtrl.remove);
router
  .route('/stripe_auth/:userId')
  .put(
    authCtrl.requireSignin,
    authCtrl.hasAuthorization,
    userCtrl.stripe_auth,
    userCtrl.update
  );

router.param('userId', userCtrl.userByID);

module.exports = router;
