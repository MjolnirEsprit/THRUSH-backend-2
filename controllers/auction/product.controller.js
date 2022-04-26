const formidable = require('formidable');
const extend = require('lodash/extend');
const Product = require('../../models/auction/product.model');

const fs = 'fs';
const defaultImage = require('./../../assets/images/default.png');

exports.create = (req, res, next) => {
  const form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        message: 'Image could not be uploaded'
      });
    }
    const product = new Product(fields);
    product.shop = req.shop;
    if (files.image) {
      product.image.data = fs.readFileSync(files.image.path);
      product.image.contentType = files.image.type;
    }
    const result = await product.save();
    res.json(result);
  });
};

exports.productByID = async (req, res, next, id) => {
  const product = await Product.findById(id)
    .populate('shop', '_id name')
    .exec();
  if (!product)
    return res.status('400').json({
      error: 'Product not found'
    });
  req.product = product;
  next();
};

exports.photo = (req, res, next) => {
  if (req.product.image.data) {
    res.set('Content-Type', req.product.image.contentType);
    return res.send(req.product.image.data);
  }
  next();
};
exports.defaultPhoto = (req, res) => {
  return res.sendFile(process.cwd() + defaultImage);
};

exports.read = (req, res) => {
  req.product.image = undefined;
  return res.json(req.product);
};

exports.update = (req, res) => {
  const form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        message: 'Photo could not be uploaded'
      });
    }
    let { product } = req;
    product = extend(product, fields);
    product.updated = Date.now();
    if (files.image) {
      product.image.data = fs.readFileSync(files.image.path);
      product.image.contentType = files.image.type;
    }

    const result = await product.save();
    res.json(result);
  });
};

exports.remove = async (req, res) => {
  const { product } = req;
  const deletedProduct = await product.remove();
  res.json(deletedProduct);
};

exports.listByShop = async (req, res) => {
  const products = await Product.find({ shop: req.shop._id })
    .populate('shop', '_id name')
    .select('-image');
  res.json(products);
};

exports.listLatest = async (req, res) => {
  const products = await Product.find({})
    .sort('-created')
    .limit(5)
    .populate('shop', '_id name')
    .exec();
  res.json(products);
};

exports.listRelated = async (req, res) => {
  const products = await Product.find({
    _id: { $ne: req.product },
    category: req.product.category
  })
    .limit(5)
    .populate('shop', '_id name')
    .exec();
  res.json(products);
};

exports.listCategories = async (req, res) => {
  const products = await Product.distinct('category', {});
  res.json(products);
};

exports.list = async (req, res) => {
  const query = {};
  if (req.query.search)
    query.name = { $regex: req.query.search, $options: 'i' };
  if (req.query.category && req.query.category !== 'All')
    query.category = req.query.category;

  const products = await Product.find(query)
    .populate('shop', '_id name')
    .select('-image')
    .exec();
  res.json(products);
};

exports.decreaseQuantity = async (req, res, next) => {
  const bulkOps = req.body.order.products.map(item => {
    return {
      updateOne: {
        filter: { _id: item.product._id },
        update: { $inc: { quantity: -item.quantity } }
      }
    };
  });

  await Product.bulkWrite(bulkOps, {});
  next();
};

exports.increaseQuantity = async (req, res, next) => {
  await Product.findByIdAndUpdate(
    req.product._id,
    { $inc: { quantity: req.body.quantity } },
    { new: true }
  ).exec();
  next();
};
