const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Kategoriya nomi kiritilishi shart'],
      trim: true,
      maxlength: [100, 'Nom 100 belgidan oshmasligi kerak'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Tavsif 500 belgidan oshmasligi kerak'],
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

categorySchema.index({ user: 1, name: 1 });

module.exports = mongoose.model('Category', categorySchema);
