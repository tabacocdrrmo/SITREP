const SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzJi6ZsCBaFq91LTd3rhroMPAxcd6eFeQS1dEtqmdmnuJxqLwMj0EUjJFEZpg3SpzPS/exec";

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
}
