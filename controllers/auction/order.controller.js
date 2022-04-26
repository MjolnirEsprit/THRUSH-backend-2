const { Order, CartItem } = '../../models/order.model';

exports.create = async (req, res) => {
  req.body.order.user = req.profile;
  const order = new Order(req.body.order);
  const result = await order.save();
  res.status(200).json(result);
};

exports.listByShop = async (req, res) => {
  const orders = await Order.find({ 'products.shop': req.shop._id })
    .populate({ path: 'products.product', select: '_id name price' })
    .sort('-created')
    .exec();
  res.json(orders);
};

exports.update = async (req, res) => {
  const order = await Order.updateOne(
    { 'products._id': req.body.cartItemId },
    {
      'products.$.status': req.body.status
    }
  );
  res.json(order);
};

exports.getStatusValues = (req, res) => {
  res.json(CartItem.schema.path('status').enumValues);
};

exports.orderByID = async (req, res, next, id) => {
  const order = await Order.findById(id)
    .populate('products.product', 'name price')
    .populate('products.shop', 'name')
    .exec();
  if (!order)
    return res.status('400').json({
      error: 'Order not found'
    });
  req.order = order;
  next();
};

exports.listByUser = async (req, res) => {
  const orders = await Order.find({ user: req.profile._id })
    .sort('-created')
    .exec();
  res.json(orders);
};

exports.read = (req, res) => {
  return res.json(req.order);
};
