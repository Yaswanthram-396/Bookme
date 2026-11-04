import Service from "../models/service.js";
import { parseServiceSettings } from "../utils/serviceSchedule.js";

export const listService = async (req, res) => {
  try {
    const services = await Service.find({
      userId: req.user.id,
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, services });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createService = async (req, res) => {
  try {
    const {
      name,
      duration,
      price,
      description,
      icon,
      bufferBefore,
      bufferAfter,
    } = req.body;
    if (!name || !duration) {
      return res
        .status(400)
        .json({ success: false, message: "Name and duration are required" });
    }
    const settings = parseServiceSettings(req.body);
    if (settings.error) {
      return res.status(400).json({ success: false, message: settings.error });
    }
    const service = await Service.create({
      ...settings.updates,
      name,
      duration,
      price,
      description,
      icon: icon || "default-icon.png",
      bufferBefore: bufferBefore || 0,
      bufferAfter: bufferAfter || 0,
      userId: req.user.id,
    });
    res.status(201).json({ success: true, service });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const updates = {};
    const allowedFields = [
      "name",
      "duration",
      "price",
      "description",
      "isActive",
      "icon",
      "bufferBefore",
      "bufferAfter",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const settings = parseServiceSettings(req.body);
    if (settings.error) {
      return res.status(400).json({ message: settings.error });
    }
    Object.assign(updates, settings.updates);

    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, isDeleted: { $ne: true } },
      updates,
      { new: true },
    );

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ message: "Service updated", service });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const service = await Service.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
        isDeleted: { $ne: true },
      },
      { isDeleted: true, isActive: false },
      { new: true },
    );
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    service.isDeleted = true;
    await service.save();
    res.json({ message: "Service deleted", service });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
