interface FormatDateTimeOptions {
    onlyYear?: boolean;
    useLocalTz?: boolean;
    includeTime?: boolean;
}


export const parseDateInput = (dateInput: string | number) => {
    if (typeof dateInput === "number") {
        return new Date(dateInput.toString().length === 10 ? dateInput * 1000 : dateInput);
    }

    const hasTime = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(dateInput);

    if (hasTime) {
        return new Date(`${dateInput.replace(" ", "T")}Z`);
    }

    return new Date(dateInput);
};


export const formatDateTime = (dateInput: string | number | null | undefined, options: FormatDateTimeOptions = {}) => {
    if (!dateInput) return "-";

    const date = parseDateInput(dateInput);

    if (isNaN(date.getTime())) return "-";

    const formatOptions: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: options.onlyYear ? undefined : "short",
        day: options.onlyYear ? undefined : "numeric",
        hour: options.includeTime ? "numeric" : undefined,
        minute: options.includeTime ? "numeric" : undefined,
        timeZone: options.useLocalTz ? new Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
        hour12: false,
    };

    if (options.onlyYear) {
        return date.toLocaleString("en-En", { timeZone: formatOptions.timeZone, year: "numeric" });
    }

    return new Intl.DateTimeFormat("en-En", formatOptions).format(date);
};
