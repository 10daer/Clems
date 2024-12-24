const MeetingHistory = require("../../model/schema/meeting");
const mongoose = require("mongoose");

const add = async (req, res) => {
  try {
    const {
      agenda,
      attendes,
      attendesLead,
      location,
      related,
      dateTime,
      notes,
    } = req.body;

    const meeting = new MeetingHistory({
      agenda,
      attendes,
      attendesLead,
      location,
      related,
      dateTime,
      notes,
      createBy: req.user._id, // Assuming you have user authentication middleware
    });

    const savedMeeting = await meeting.save();

    res.status(201).json({
      success: true,
      data: savedMeeting,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const meetings = await MeetingHistory.find({ deleted: false })
      .populate("attendes", "name email")
      .populate("attendesLead", "name email")
      .populate("createBy", "name")
      .skip(skip)
      .limit(limit)
      .sort({ timestamp: -1 });

    const total = await MeetingHistory.countDocuments({ deleted: false });

    res.status(200).json({
      success: true,
      data: meetings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const view = async (req, res) => {
  try {
    const meeting = await MeetingHistory.findById(req.params.id)
      .populate("attendes", "name email")
      .populate("attendesLead", "name email")
      .populate("createBy", "name");

    if (!meeting || meeting.deleted) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteData = async (req, res) => {
  try {
    const meeting = await MeetingHistory.findById(req.params.id);

    if (!meeting || meeting.deleted) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    meeting.deleted = true;
    await meeting.save();

    res.status(200).json({
      success: true,
      message: "Meeting deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteMany = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of meeting IDs",
      });
    }

    await MeetingHistory.updateMany(
      { _id: { $in: ids } },
      { $set: { deleted: true } }
    );

    res.status(200).json({
      success: true,
      message: "Meetings deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { add, index, view, deleteData, deleteMany };
