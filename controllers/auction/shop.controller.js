const extend = require('lodash/extend');
const formidable = require('formidable');
const fs = require('fs');
const Shop = require('../../models/auction/shop.model');
const defaultImage = require('./../../assets/images/default.png');

exports.create = (req, res) => {
  const form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(400).json({
        message: 'Image could not be uploaded'
      });
    }
    const shop = new Shop(fields);
    shop.owner = req.profile;
    if (files.image) {
      shop.image.data = fs.readFileSync(files.image.path);
      shop.image.contentType = files.image.type;
    }
    const result = await shop.save();
    res.status(200).json(result);
  });
};

exports.shopByID = async (req, res, next, id) => {
  const shop = await Shop.findById(id)
    .populate('owner', '_id name')
    .exec();
  if (!shop)
    return res.status('400').json({
      error: 'Shop not found'
    });
  req.shop = shop;
  next();
};

exports.photo = (req, res, next) => {
  if (req.shop.image.data) {
    res.set('Content-Type', req.shop.image.contentType);
    return res.send(req.shop.image.data);
  }
  next();
};
exports.defaultPhoto = (req, res) => {
  return res.sendFile(process.cwd() + defaultImage);
};

exports.read = (req, res) => {
  req.shop.image = undefined;
  return res.json(req.shop);
};

exports.update = (req, res) => {
  const form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(400).json({
        message: 'Photo could not be uploaded'
      });
    }
    let { shop } = req;
    shop = extend(shop, fields);
    shop.updated = Date.now();
    if (files.image) {
      shop.image.data = fs.readFileSync(files.image.path);
      shop.image.contentType = files.image.type;
    }

    const result = await shop.save();
    res.json(result);
  });
};

exports.remove = async (req, res) => {
  const { shop } = req;
  const deletedShop = shop.remove();
  res.json(deletedShop);
};

exports.list = async (req, res) => {
  const shops = await Shop.find();
  res.json(shops);
};

exports.listByOwner = async (req, res) => {
  const shops = await Shop.find({ owner: req.profile._id }).populate(
    'owner',
    '_id name'
  );
  res.json(shops);
};

exports.isOwner = (req, res, next) => {
  const isOwner = req.shop && req.auth && req.shop.owner._id == req.auth._id;
  if (!isOwner) {
    return res.status('403').json({
      error: 'User is not authorized'
    });
  }
  next();
};
