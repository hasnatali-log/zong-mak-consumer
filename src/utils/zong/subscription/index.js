const axios = require("axios");
const { Users } = require("../../../models/ww_db");
const { alreadySubCheck } = require("../../../services/mongo/alreadySubCheck");

// Dedicated instance for Zong BSS
const zongBssApi = axios.create({
    baseURL: "http://192.168.12.177/provisioning/api/zong-bss",
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

const _persistSubscription = async ({ phone, package_type, source, subMode, auser }) => {
    try {
        await Users.findOneAndUpdate(
            { phone },
            {
                fcm: auser ? auser.fcm : [],
                carrier: "zong",
                network_type: package_type,
                phone,
                is_pkg_chng: false,
                regDate: new Date(),
                package_type,
                status: "premium",
                source,
                under_process: false,
                subMode,
                $push: {
                    logs: {
                        status: "premium",
                        date: new Date(),
                        mode: source,
                        carrier: "zong"
                    }
                }
            },
            { upsert: true }
        );
    } catch (err) {
        console.error("[_persistSubscription] MongoDB update failed for", phone, err.message);
    }
};

const subscribe_zong_num = async (params) => {
    let {
        cellno,
        package_type,
        source = 6,
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

    source = Number(source);
    if (!Number.isFinite(source)) {
        source = 6;
    }

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
        const auser = await alreadySubCheck({ ...params, api: "subscribe" });
        if (auser?.success) {
            if (auser?.under_process)
                return {
                    success: false,
                    msg: "This user is already subscribed",
                    record: { phone: cellno, isSubscribed: true },
                };
        }

        const response = await zongBssApi.post("/subscribe-bundle", payload);
        const data = response.data;

        if (data.success === true || data.status === "SUCCESS") {
            // Return immediately, then persist to MongoDB in the background
            const result = {
                success: true,
                msg: data.message || "Subscription successful",
                record: { phone, redirect: true },
                msisdn,
            };

            _persistSubscription({ phone, package_type, source, subMode, auser });

            return result;
        }

        // Treat "already subscribed" as success
        const msgLower = (data.msg || data.message || data.error || "").toLowerCase();
        if (msgLower.includes("already subscribed") || msgLower.includes("already active")) {
            return {
                success: true,
                alreadySubscribed: true,
                msg: "Already subscribed",
                record: data,
                msisdn,
            };
        }

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

            // Return immediately, then persist to MongoDB in the background
            const result = {
                success: true,
                msg: "Subscription successful",
                record: { phone, redirect: true },
                msisdn,
            };

            _persistSubscription({ phone, package_type, source, subMode, auser });

            return result;
        }

        if (errMsg.includes("already subscribed") || errMsg.includes("already active")) {
            return {
                success: true,
                alreadySubscribed: true,
                msg: "Already subscribed",
                record: error.response?.data?.record || null,
                msisdn,
            };
        }

        return {
            success: false,
            msg: errMsg,
            record: error.response?.data || error.message,
            msisdn,
        };
    }
};

module.exports = { subscribe_zong_num };