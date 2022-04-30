const extend = require('lodash/extend');
const request = require('request');
const stripe = require('stripe');
const config = require('./../../config/config');
const UserAuction = require('../../models/auction/user.model');

const myStripe = stripe(config.stripe_test_secret_key);

exports.create = async (req, res) => {
  const user = new UserAuction(req.body);
  await user.save();
  return res.status(200).json({
    message: 'Successfully signed up!'
  });
};

/**
 * Load user and append to req.
 */
exports.userByID = async (req, res, next, id) => {
  const user = await UserAuction.findById(id);
  if (!user)
    return res.status('400').json({
      error: 'User not found'
    });
  req.profile = user;
  next();
};

exports.read = (req, res) => {
  req.profile.hashed_password = undefined;
  req.profile.salt = undefined;
  return res.json(req.profile);
};

exports.list = async (req, res) => {
  const users = await UserAuction.find().select('name email updated created');
  res.json(users);
};

exports.update = async (req, res) => {
  let user = req.profile;
  user = extend(user, req.body);
  user.updated = Date.now();
  await user.save();
  user.hashed_password = undefined;
  user.salt = undefined;
  res.json(user);
};

exports.remove = async (req, res) => {
  const user = req.profile;
  const deletedUser = await user.remove();
  deletedUser.hashed_password = undefined;
  deletedUser.salt = undefined;
  res.json(deletedUser);
};

exports.isSeller = (req, res, next) => {
  const isSeller = req.profile && req.profile.seller;
  if (!isSeller) {
    return res.status('403').json({
      error: 'User is not a seller'
    });
  }
  next();
};

exports.stripe_auth = (req, res, next) => {
  request(
    {
      url: 'https://connect.stripe.com/oauth/token',
      method: 'POST',
      json: true,
      body: {
        client_secret: config.stripe_test_secret_key,
        code: req.body.stripe,
        grant_type: 'authorization_code'
      }
    },
    (error, response, body) => {
      //update user
      if (body.error) {
        return res.status('400').json({
          error: body.error_description
        });
      }
      req.body.stripe_seller = body;
      next();
    }
  );
};

exports.stripeCustomer = (req, res, next) => {
  if (req.profile.stripe_customer) {
    //update stripe customer
    myStripe.customers.update(
      req.profile.stripe_customer,
      {
        source: req.body.token
      },
      (err, customer) => {
        if (err) {
          return res.status(400).send({
            error: 'Could not update charge details'
          });
        }
        req.body.order.payment_id = customer.id;
        next();
      }
    );
  } else {
    myStripe.customers
      .create({
        email: req.profile.email,
        source: req.body.token
      })
      .then(customer => {
        UserAuction.update(
          { _id: req.profile._id },
          { $set: { stripe_customer: customer.id } },
          err => {
            if (err) {
              return res.status(400).send({
                error: 'Could not update charge details'
              });
            }
            req.body.order.payment_id = customer.id;
            next();
          }
        );
      });
  }
};

exports.createCharge = (req, res, next) => {
  if (!req.profile.stripe_seller) {
    return res.status('400').json({
      error: 'Please connect your Stripe account'
    });
  }
  myStripe.tokens
    .create(
      {
        customer: req.order.payment_id
      },
      {
        stripeAccount: req.profile.stripe_seller.stripe_user_id
      }
    )
    .then(token => {
      myStripe.charges
        .create(
          {
            amount: req.body.amount * 100, //amount in cents
            currency: 'usd',
            source: token.id
          },
          {
            stripeAccount: req.profile.stripe_seller.stripe_user_id
          }
        )
        .then(() => {
          next();
        });
    });
};
