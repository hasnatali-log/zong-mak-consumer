async function checkZongNum(params) {
    try {
        let { cellno: phone } = params;
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
            return { carrier: null, msg: resp?.msg };
        }
    } catch (err) {
        return { carrier: null };
    }
}

module.exports = {
    checkZongNum,
};
