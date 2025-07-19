const Joi = require("joi");

const putBackValidation = Joi.object({
  deletionId: Joi.string().required().min(36).max(36),
});

module.exports = {
  putBackValidation,
};
