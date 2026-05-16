const { wwDb } = require("../../../database");
const mongoose = require("mongoose");

//Users' Schema
const userSchema = mongoose.Schema(
  {
    favouriteLocations: {
      type: Array,
    },
    uid: { type: String },
    name: { type: String },
    language: { type: String },
    phone: { type: String },
    status: { type: String },
    fcm: { type: Array },
    gender: { type: String },
    profession: {
      type: Object,
      Default: {
        _id: "6391c2fbe42d8b56485a5d33",
        profession_Eng: "WeatherWalay",
        profession_Urdu: "ویدر والے",
      },
    },
    personalityType: { type: String },
    notifications: { type: Object },
    currentLocation: { type: Object },
    quickNotifications: { type: Array },
    gNotif: { type: Boolean },
    regDate: { type: Date, default: new Date() },
    subMode: { type: String },
    unsubMode: { type: String },
    subDate: { type: Date },
    unsubDate: { type: Date },
    logs: { type: Array },
    billingLogs: { type: Array },
    paymentMethod: { type: String },
    paymentSourceAccount: { type: String },
    carrier: { type: String, default: null },
    hasApp: { type: Boolean, default: true },
    package_type: { type: Number },
    network_type: { type: Number },
    source: { type: Number },
    is_pkg_chng: { type: Boolean },
    isEnqueue: { type: Boolean },
    under_process: { type: Boolean }
  },
  { collection: "users" }
);

module.exports = wwDb.model("Users", userSchema);
