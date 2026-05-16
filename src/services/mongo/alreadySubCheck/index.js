const { Users } = require("../../../models/ww_db");

const alreadySubCheck = async (params) => {

    let { cellno: phone, telco, subDomain, api, adID = "none", flow = "none", isHeaderEnriched = "none" } = params;


    try {

        let user = await Users.findOne({ phone, status: "premium" });
        if (user) {
            console.log("User Already Subscribed", user);
            return { success: true, msg: "Already Subscribed", record: { phone: user?._doc?.phone } };
        }
        return { success: false, msg: "User not subscribed" };  // Changed "Songs" to a more relevant message.

    } catch (error) {
        console.error("Error in alreadySubCheck", error.stack || error);  // Added error stack logging
        return { success: false, msg: "User cannot be checked", record: null };
    }
}

module.exports = { alreadySubCheck };
