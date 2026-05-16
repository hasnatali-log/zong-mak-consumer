const axios = require("axios");
const { logger } = require("../../../logger");

const send_zong_otp = async (ata) => {
    try {

        const { cellno: phone, traceID } = ata;
        // API endpoint
        const url = "http://192.168.12.177/otp/otp/get-otp";

        // Prepare query params
        const params = {
            msisdn: 92 + phone.slice(1),       // e.g., "923159178387"
            carrier: "zong",
            traceID: "njhkjkj"     // carrier name
        };

        // Make GET request
        const response = await axios.get(url, { params });

        // Log success
        logger("OTP Sent Successfully", "send_zong_otp", response.data);
        response.data.traceID = traceID;
        return response.data; // Return OTP response
    } catch (error) {
        logger("Error Sending OTP: ", "send_zong_otp", error?.message);
        throw error; // Optional: rethrow for caller to handle
    }
};




// Optional: Add timeout and better config
const axiosInstance = axios.create({
    timeout: 10000, // 10 seconds timeout
    headers: {
        "Content-Type": "application/json",
    },
});

const verify_otp_zong = async (data) => {
    // Input validation
    if (!data?.msisdn || !data?.otp || !data?.traceID) {
        const missing = !data?.msisdn ? "msisdn" : !data?.otp ? "otp" : "traceID";
        logger(`Missing required field: ${missing}`, "verify_otp_zong", { data }, "warn");
        return {
            success: false,
            msg: `Missing required field: ${missing}`,
            record: null,
        };
    }

    const url = "http://192.168.12.177/otp/otp/verify-otp";

    const payload = {
        msisdn: 92 + data.msisdn.slice(1),
        otp: data.otp.toString(), // Ensure OTP is string (some systems expect string)
        traceID: data.traceID,
    };

    try {
        const response = await axiosInstance.post(url, payload);

        // Successful response from API
        logger("OTP Verified Successfully", "verify_otp_zong", {
            msisdn: data.msisdn,
            traceID: data.traceID,
            responseData: response.data,
        });

        return {
            success: true,
            msg: "OTP verification successful",
            record: response.data,
        };
    } catch (error) {
        // Properly handle Axios errors
        let errorMessage = "OTP verification failed";
        let errorDetails = null;
        let statusCode = null;

        if (error.response) {
            // Server responded with error status (4xx, 5xx)
            statusCode = error.response.status;
            errorDetails = error.response.data;
            errorMessage = error.response.data?.error || error.response.data?.message || `HTTP ${statusCode}`;
        } else if (error.request) {
            // No response received (network issue, timeout, etc.)
            errorMessage = "No response from OTP verification service";
            errorDetails = "Network error or service unreachable";
        } else {
            // Other errors (code bugs, etc.)
            errorMessage = error.message || "Unknown error during OTP verification";
        }

        // Enhanced logging (avoid logging full error in prod if sensitive)
        logger("Error in verify_otp_zong", "verify_otp_zong", {
            msisdn: data.msisdn,
            traceID: data.traceID,
            error: errorMessage,
            statusCode,
            responseData: errorDetails,
            stack: error.stack,
        }, "error");

        // Always return consistent structure
        return errorDetails
    }
};


module.exports = {
    send_zong_otp,
    verify_otp_zong
};