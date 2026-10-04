import { matchedData } from 'express-validator';
import {
  adminListProducts, adminGetProduct, createProduct, updateProduct, hideProduct,
} from '../services/adminProducts.service.js';

export const listProducts = async (req, res) => {
  const { search, page = 1, limit = 20 } = matchedData(req);
  const result = await adminListProducts({ search: search || null, page, limit });
  res.status(200).json({ success: true, ...result });
};

export const getProduct = async (req, res) => {
  const product = await adminGetProduct(req.params.id);
  res.status(200).json({ success: true, product });
};

export const addProduct = async (req, res) => {
  const product = await createProduct(matchedData(req, { locations: ['body'] }));
  res.status(201).json({ success: true, product });
};

export const editProduct = async (req, res) => {
  const product = await updateProduct(req.params.id, matchedData(req, { locations: ['body'] }));
  res.status(200).json({ success: true, product });
};

export const removeProduct = async (req, res) => {
  await hideProduct(req.params.id);
  res.status(204).end();
};