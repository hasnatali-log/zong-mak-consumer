const axios = require("axios");

const send_zong_otp = async (ata) => {
    try {

        const { cellno: phone, traceID } = ata;
        // API endpoint
        const url = "http://192.168.12.177/otp/otp/get-otp";

        // Prepare query params
        const params = {
            msisdn: phone,       // e.g., "923159178387"
            carrier: "zong",
            traceID: "njhkjkj"     // carrier name
        };

        // Make GET request
        const response = await axios.get(url, { params, timeout: 10000 });

        response.data.traceID = traceID;
        return response.data; // Return OTP response
    } catch (error) {
        throw error;
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
            statusCode = error.response.status;
            errorDetails = error.response.data;
            errorMessage = error.response.data?.error || error.response.data?.message || `HTTP ${statusCode}`;
        } else if (error.request) {
            errorMessage = "No response from OTP verification service";
            errorDetails = "Network error or service unreachable";
        } else {
            errorMessage = error.message || "Unknown error during OTP verification";
        }

        return errorDetails;
    }
};


module.exports = {
    send_zong_otp,
    verify_otp_zong
};