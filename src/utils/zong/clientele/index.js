async function checkZongNum(params) {
    try {
        let { cellno: phone } = params;
        console.log("Original Phone Number: ", phone);
        console.log("Checking Zong Number: ", phone);
        const response = await fetch(`http://192.168.12.177/provisioning/api/zong-bss/check-subscriber`, {
            method: "post",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userNumber: phone,
                checkBalance: false
                // traceID
            }),
        });
        const resp = await response.json();
        if (resp?.success) {
            console.log("Zong User Flow success", phone, resp);
            return {
                carrier: "zong",
                success: true,
                record: {
                    packageArray: resp?.record?.packages,
                    network_type:
                        resp?.record?.result?.subtype == "P"
                            ? "prepaid"
                            : resp?.record?.result?.subtype == "B"
                                ? "postpaid"
                                : null,
                },

            };
        } else {
            if (resp?.msg == "insufficient balance") {
                return {
                    carrier: "zong",
                    success: true,
                    msg: "insufficient balance",
                };
            }
            console.log("Failure", phone, resp);
            return { carrier: null, msg: resp?.msg };
        }
    } catch (err) {
        console.log("Error: ", err);
        return { carrier: null };
    }
}

module.exports = {
    checkZongNum,
};
