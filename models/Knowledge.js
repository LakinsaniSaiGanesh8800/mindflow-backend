const mongoose = require('mongoose');

const knowledgeSchema = new mongoose.Schema(
  {
    // NEW: associate knowledge with a user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxLength: [200, 'Title cannot exceed 200 characters']
    },

    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true
    },

    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: ['note', 'link', 'insight'],
        message: 'Type must be note, link, or insight'
      }
    },

    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],

    summary: {
      type: String,
      trim: true
    },

    sourceUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
        },
        message: 'Invalid URL format'
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Text search index
knowledgeSchema.index(
  { title: 'text', content: 'text', tags: 'text', summary: 'text' },
  {
    weights: {
      title: 10,
      tags: 5,
      summary: 3,
      content: 1
    }
  }
);

// Other indexes
knowledgeSchema.index({ userId: 1 });
knowledgeSchema.index({ type: 1 });
knowledgeSchema.index({ tags: 1 });
knowledgeSchema.index({ createdAt: -1 });

const Knowledge = mongoose.model('Knowledge', knowledgeSchema);

module.exports = Knowledge;