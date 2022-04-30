const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config({
  path: './config.env'
});
const app = require('./app');
const Auction = require('./models/auction/auction.model');

const DB = process.env.DATABASE;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); // update to match the domain you will make the request from
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

app.use(cors());

// eslint-disable-next-line import/order
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', socket => {
  socket.emit('me', socket.id);
  socket.on('disconnect', () => {
    socket.broadcast.emit('callended');
  });
  socket.on('calluser', ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit('calluser', {
      signal: signalData,
      from,
      name
    });
  });
  socket.on('answercall', data => {
    io.to(data.to).emit('callaccepted', data.signal);
  });
});

io.on('connection', function(socket) {
  socket.on('join auction room', data => {
    socket.join(data.room);
  });
  socket.on('leave auction room', data => {
    socket.leave(data.room);
  });
  socket.on('new bid', data => {
    bid(data.bidInfo, data.room);
  });
});
const bid = async (bid, auction) => {
  try {
    let result = await Auction.findOneAndUpdate(
      {
        _id: auction,
        $or: [
          {
            'bids.0.bid': {
              $lt: bid.bid
            }
          },
          {
            bids: {
              $eq: []
            }
          }
        ]
      },
      {
        $push: {
          bids: {
            $each: [bid],
            $position: 0
          }
        }
      },
      {
        new: true
      }
    )
      .populate('bids.bidder', '_id name')
      .populate('seller', '_id name')
      .exec();
    io.to(auction).emit('new bid', result);
  } catch (err) {
    console.log(err);
  }
};

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
