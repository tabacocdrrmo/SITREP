const SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzt64mWdtdcuAbaTSZu8_SYJciCrLJtEbxHHsY_5ImE4WJnM3b5d1ZnOOeWhrSHnsdm/exec";

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
}
