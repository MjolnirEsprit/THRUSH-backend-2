const express = require('express');
const instrument = require('./../models/instrumentModel');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

exports.addinstrument = async (req, res) => {
  try {
    const newInstrument = await instrument.create(req.body);
    res.status(200).json(newInstrument);
  } catch (e) {
    res.status(500).send(e);
  }
};

exports.getAllinstruments = async (req, res) => {
  try {
    const instruments = await instrument.find();
    res.json(instruments);
  } catch (e) {
    console.log(e);
  }
};

exports.getinstrument = async (req, res) => {
  try {
    const instrument = await instrument.findById(req.params.id);
    res.status(200).json(instrument);
  } catch (e) {
    console.log(e);
  }
};

exports.updateinstrument = async (req, res) => {
  const { id } = req.params;
  const { name, description, stock, price } = req.body;
  try {
    const instrument = await Instrument.findByIdAndUpdate(id, {
      name,
      description,
      stock,
      price
    });
    res.json(instrument);
  } catch (e) {
    res.status(500).send(e);
    console.log(e);
  }
};

exports.deleteinstrument = async (req, res) => {
  try {
    await instrument.findByIdAndDelete(req.params.id);
    res.status(200).json('deleted');
  } catch (e) {
    res.status(500).json();
    console.log(e);
  }
};
