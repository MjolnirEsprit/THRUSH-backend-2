const express = require('express');
const instrumentController = require('./../controllers/instrumentsController');

const router = express.Router();

router
  .route('/')
  .get(instrumentController.getAllInstruments)
  .post(instrumentController.createInstrument);

router
  .route('/:id')
  .get(instrumentController.getInstrument)
  .put(instrumentController.updateInstrument)
  .delete(instrumentController.deleteInstrument);

module.exports = router;
