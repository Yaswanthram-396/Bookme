import Service from "../models/service.js";

export const listService = async (req, res) => {
  try {
    const services = (
      await Service.find({ userId: req.user.id, isDeleted: { $ne: true } })
    ).toSorted({ createdAt: -1 });
    res.status(200).json({ success: true, services });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createService = async (req, res) => {
  try {
    const { name, duration, price, description, icon } = req.body;
    if (!name || !duration) {
      return res
        .status(400)
        .json({ success: false, message: "Name and duration are required" });
    }
    const service = await Service.create({
      name,
      duration,
      price,
      description,
      icon: icon || "default-icon.png",
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
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

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
