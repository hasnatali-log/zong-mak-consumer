const axios = require("axios");
const { logger } = require("../../../../logger");
const { Users } = require("../../../models/ww_db");

// Dedicated instance for Zong BSS
const zongBssApi = axios.create({
    baseURL: "http://192.168.12.177/provisioning/api/zong-bss",
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

const subscribe_zong_num = async (params) => {
    let {
        cellno,
        package_type,
        source,
        ip,
        isHeaderEnriched,
        platform,
        tag,
        makRoute,
        adID,
        flow,
        subDomain: inputSubDomain,
        subMode = "WEB",
        subtype = "NEW"
    } = params;


    // Normalize to 92xxxxxxxxxxx
    let msisdn = cellno.toString().trim();
    if (msisdn.startsWith("0")) msisdn = "92" + msisdn.slice(1);
    if (msisdn.startsWith("+92")) msisdn = "92" + msisdn.slice(3);
    if (!/^92[0-9]{10}$/.test(msisdn)) {
        return { success: false, msg: "Invalid MSISDN format" };
    }

    // Convert msisdn back to local format for DB operations
    let phone = "0" + msisdn.slice(2);
    const payload = {
        msisdn,
        package_type: package_type == "0" ? 1 : package_type.toString(),
        subMode: "6",
        subtype: subtype.toUpperCase(),
        channel: "6",
        source: source || "6",
        traceID: `ZONG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    try {
        logger(
            `Zong subscription request → ${msisdn} | Package: ${package_type}`,
            "subscribe_zong_num",
            payload
        );

        // Check 


        const response = await zongBssApi.post("/subscribe-bundle", payload);
        const data = response.data;

        logger(
            `Zong subscription success → ${msisdn}`,
            "subscribe_zong_num",
            data
        );

        if (data.success === true || data.status === "SUCCESS") {
            // Update MongoDB on successful subscription
            const updatedUser = await Users.findOneAndUpdate(
                { phone },
                {
                    fcm: auser ? auser.fcm : [],
                    carrier: "zong",
                    network_type: package_type,
                    phone,
                    is_pkg_chng: false,
                    regDate: new Date(),
                    package_type: package_type,
                    status: "premium",
                    source,
                    under_process: false,
                    subMode: subMode,
                    $push: {
                        logs: {
                            status: "premium",
                            date: new Date(),
                            mode: source,
                            carrier: "zong"
                        }
                    }
                },
                { new: true, upsert: true }
            );

            console.log("Updated User: ", updatedUser?._doc?.phone, updatedUser?._doc?.status);

            prometheusEventRegister("metrics/telco_api_success", {
                api_name: "subscribe",
                adID,
                telco: "zong",
                flow: flow?.flow ?? flow,
                campaign: subDomain,
                isHeaderEnriched,
                status: "OK"
            });

            if (updatedUser) {
                updatedUser.log = undefined;
                updatedUser.billingLogs = undefined;
                updatedUser.quickNotifications = undefined;
                updatedUser.favouriteLocations = undefined;
                updatedUser.profession = undefined;

                return {
                    success: true,
                    msg: data.message || "Subscription successful",
                    record: { ...updatedUser._doc, redirect: true },
                    msisdn,
                };
            } else {
                return {
                    success: false,
                    msg: "Unable to update user record",
                    record: data,
                    msisdn,
                };
            }
        }

        // Treat "already subscribed" as success
        const msgLower = (
            data.msg ||
            data.message ||
            data.error ||
            ""
        ).toLowerCase();
        if (
            msgLower.includes("already subscribed") ||
            msgLower.includes("already active")
        ) {
            prometheusEventRegister("metrics/telco_api_success", {
                api_name: "subscribe",
                adID,
                telco: "zong",
                flow: flow?.flow ?? flow,
                campaign: subDomain,
                isHeaderEnriched,
                status: "OK"
            });

            return {
                success: true,
                alreadySubscribed: true,
                msg: "Already subscribed",
                record: data,
                msisdn,
            };
        }

        prometheusEventRegister("metrics/telco_api_success", {
            api_name: "subscribe",
            adID,
            telco: "zong",
            flow: flow?.flow ?? flow,
            campaign: subDomain,
            isHeaderEnriched,
            status: "KO"
        });

        return {
            success: false,
            msg: data.message || data.error || "Subscription failed",
            record: data,
            msisdn,
        };
    } catch (error) {
        const errMsg =
            error.response?.data?.message ||
            error.response?.data?.msg ||
            error.response?.data?.error ||
            error.message ||
            "Zong BSS unreachable";

        if (errMsg.includes("Subscribe bundle rejected")) {
            const auser = await alreadySubCheck({ ...params, api: "subscribe" });
            if (auser?.success) {
                if (auser?.under_process)
                    return {
                        success: false,
                        msg: "This user is already subscribed",
                        record: { phone: cellno, isSubscribed: true },
                    };
            }

            // Update MongoDB on successful subscription
            const updatedUser = await Users.findOneAndUpdate(
                { phone },
                {
                    fcm: auser ? auser.fcm : [],
                    carrier: "zong",
                    network_type: package_type,
                    phone,
                    is_pkg_chng: false,
                    regDate: new Date(),
                    package_type: package_type,
                    status: "premium",
                    source,
                    under_process: false,
                    subMode: subMode,
                    $push: {
                        logs: {
                            status: "premium",
                            date: new Date(),
                            mode: source,
                            carrier: "zong"
                        }
                    }
                },
                { new: true, upsert: true }
            );

            console.log("Updated User: ", updatedUser?._doc?.phone, updatedUser?._doc?.status);

            prometheusEventRegister("metrics/telco_api_success", {
                api_name: "subscribe",
                adID,
                telco: "zong",
                flow: flow?.flow ?? flow,
                campaign: subDomain,
                isHeaderEnriched,
                status: "OK"
            });

            if (updatedUser) {
                updatedUser.log = undefined;
                updatedUser.billingLogs = undefined;
                updatedUser.quickNotifications = undefined;
                updatedUser.favouriteLocations = undefined;
                updatedUser.profession = undefined;

                return {
                    success: true,
                    msg: data?.message || "Subscription successful",
                    record: { ...updatedUser._doc, redirect: true },
                    msisdn,
                };
            } else {
                return {
                    success: false,
                    msg: "Unable to update user record",
                    record: data,
                    msisdn,
                };
            }

        }

        prometheusEventRegister("metrics/telco_api_failure", {
            api_name: "subscribe",
            adID,
            telco: "zong",
            flow: flow?.flow ?? flow,
            campaign: subDomain,
            isHeaderEnriched,
            status: "KO"
        });

        if (
            errMsg.includes("already subscribed") ||
            errMsg.includes("already active")
        ) {
            return {
                success: true,
                alreadySubscribed: true,
                msg: "Already subscribed",
                record: error.response?.data.record || null,
                msisdn,
            };
        }
        const errDetails = error.response?.data || error.message;

        logger(
            "Zong subscription failed → " + msisdn,
            "subscribe_zong_num",
            {
                error: errMsg,
                status: error.response?.status,
                details: errDetails,
            },
            "error"
        );

        return {
            success: false,
            msg: errMsg,
            record: errDetails,
            msisdn,
        };
    }
};

module.exports = { subscribe_zong_num };