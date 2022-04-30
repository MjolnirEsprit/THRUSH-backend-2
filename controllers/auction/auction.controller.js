const extend = require('lodash/extend');
const formidable = require('formidable');
const fs = require('fs');
const Auction = require('../../models/auction/auction.model');
//const defaultImage = require('./../../assets/images/default.png');

exports.create = (req, res) => {
  const form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(400).json({
        message: 'Image could not be uploaded'
      });
    }
    const auction = new Auction(fields);
    auction.seller = req.profile;
    if (files.image) {
      auction.image.data = fs.readFileSync(files.image.path);
      auction.image.contentType = files.image.type;
    }
    const result = await auction.save();
    res.status(200).json(result);
  });
};

exports.auctionByID = async (req, res, next, id) => {
  const auction = await Auction.findById(id)
    .populate('seller', '_id name')
    .populate('bids.bidder', '_id name')
    .exec();
  if (!auction)
    return res.status('400').json({
      error: 'Auction not found'
    });
  req.auction = auction;
  next();
};

exports.photo = (req, res, next) => {
  if (req.auction.image.data) {
    res.set('Content-Type', req.auction.image.contentType);
    return res.send(req.auction.image.data);
  }
  next();
};

exports.defaultPhoto = (req, res) => {
  return res.sendFile(process.cwd());
};

exports.read = (req, res) => {
  req.auction.image = undefined;
  return res.json(req.auction);
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
    let { auction } = req;
    auction = extend(auction, fields);
    auction.updated = Date.now();
    if (files.image) {
      auction.image.data = fs.readFileSync(files.image.path);
      auction.image.contentType = files.image.type;
    }

    const result = await auction.save();
    res.json(result);
  });
};

exports.remove = async (req, res) => {
  const { auction } = req;
  const deletedAuction = auction.remove();
  res.json(deletedAuction);
};

exports.listOpen = async (req, res) => {
  const auctions = await Auction.find({ bidEnd: { $gt: new Date() } })
    .sort('bidStart')
    .populate('seller', '_id name')
    .populate('bids.bidder', '_id name');
  res.json(auctions);
};

exports.listBySeller = async (req, res) => {
  const auctions = await Auction.find({ seller: req.profile._id })
    .populate('seller', '_id name')
    .populate('bids.bidder', '_id name');
  res.json(auctions);
};
exports.listByBidder = async (req, res) => {
  const auctions = await Auction.find({ 'bids.bidder': req.profile._id })
    .populate('seller', '_id name')
    .populate('bids.bidder', '_id name');
  res.json(auctions);
};

exports.isSeller = (req, res, next) => {
  const isSeller =
    req.auction && req.auth && req.auction.seller._id === req.auth._id;
  if (!isSeller) {
    return res.status('403').json({
      error: 'User is not authorized'
    });
  }
  next();
};
