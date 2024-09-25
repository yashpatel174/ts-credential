export const required = (res, ...fields) => {
    const missingFields = fields
        .map((field) => ({
        name: Object.keys(field)[0],
        value: Object.values(field)[0],
    }))
        .filter(({ value }) => !value || value.trim() === "");
    if (missingFields.length > 0) {
        const missingFieldNames = missingFields.map(({ name }) => name).join(", ");
        res.status(400).json({
            error: `Missing required fields: ${missingFieldNames}`,
        });
    }
};
export const response = (res, message, status, result) => {
    if (status !== undefined) {
        res.status(status);
    }
    const payload = {
        message,
    };
    if (result) {
        payload.result = result;
    }
    return res.send(payload);
};
