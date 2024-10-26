const Joi = require("joi");

const createValidation = Joi.object({
  name: Joi.string().required().min(3),
  description: Joi.string(),
});

const updateValidation = Joi.object({
  name: Joi.string().required().min(3),
  description: Joi.string(),
});

module.exports = {
  createValidation,
  updateValidation
};
