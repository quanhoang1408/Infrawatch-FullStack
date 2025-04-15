// src/models/monitoring.model.js
const mongoose = require('mongoose');

const monitoringSchema = mongoose.Schema(
  {
    vmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VM',
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    cpu: {
      usagePercent: {
        type: Number,
        required: true,
      },
    },
    memory: {
      totalMB: {
        type: Number,
        required: true,
      },
      usedMB: {
        type: Number,
        required: true,
      },
      usagePercent: {
        type: Number,
        required: true,
      },
    },
    disk: [
      {
        path: {
          type: String,
          required: true,
        },
        totalGB: {
          type: Number,
          required: true,
        },
        usedGB: {
          type: Number,
          required: true,
        },
        usagePercent: {
          type: Number,
          required: true,
        },
      },
    ],
    network: {
      bytesSent: {
        type: Number,
        required: true,
      },
      bytesRecv: {
        type: Number,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Tạo index cho tối ưu truy vấn
monitoringSchema.index({ vmId: 1, timestamp: -1 });

// Chuyển đổi model thành JSON
monitoringSchema.methods.toJSON = function() {
  const monitoring = this.toObject();
  delete monitoring.__v;
  return monitoring;
};

const Monitoring = mongoose.model('Monitoring', monitoringSchema);

module.exports = Monitoring;