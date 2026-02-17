export const LOCAL_EN = "en-US";

export function formatTime(timeToConvert, local = LOCAL_EN) {
    const now = timeToConvert === null ? new Date() : new Date(timeToConvert);

    const dd = String(now.getDate()).padStart(2, "0");
    const mo = new Intl.DateTimeFormat(local, { month: "short" }).format(now);
    const yyyy = String(now.getFullYear());

    const HH = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");

    const offsetMinutes = -now.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const offsetHours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, "0");
    const offsetMins = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");

    return `${dd}/${mo}/${yyyy} ${HH}:${mm} (${sign}${offsetHours}:${offsetMins} UTC)`;
}

export function mapColumnName2Dataset (columnName) {
    let dataset;
    switch (columnName) {
        case "select": dataset = "select"; break;
        case "ID": dataset = "number"; break;
        case "Done": dataset = "done"; break;
        case "Priority": dataset = "priority"; break;
        case "Group": dataset = "group"; break;
        case "Task details": dataset = "details"; break;
        case "Deadline": dataset = "deadline"; break;
        case "Created At": dataset = "created"; break;
        case "Updated At": dataset = "updated"; break;
        default: break;
    }

    return dataset;
}