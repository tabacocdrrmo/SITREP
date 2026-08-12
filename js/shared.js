const SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxdqINB7ihQHev_2sRXlO6iH0P4QouoCFm4KhoAwQ69iBVgbY9HybkXFV1BCffA5uSI/exec";

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
}
