# Pipedrive Data Synchronization Assignment

## Edge Cases Handled

1. **Nested JSON Property Traversal (`getNestedValue`)**
   - **Issue:** `mappings.json` uses dot-notation string paths (e.g., `"phoneNumber.home"`). Standard object bracket access (`inputData["phoneNumber.home"]`) returns `undefined`.
   - **Handling:** Implemented a custom helper function using `Array.prototype.reduce()` to safely traverse deeply nested objects without throwing runtime `TypeError` exceptions.

2. **Missing Search Key (`name`) Validation**
   - **Issue:** If the `name` field is absent in `mappings.json` or `inputData.json`, the lookup query sent to Pipedrive would be empty or undefined, causing malformed requests or false matches.
   - **Handling:** Added pre-fetch validation that verifies the extracted `searchName` exists and is a valid string before making any API calls, throwing a clear custom error if missing.

3. **Environment Variable Sanitization & Carriage Return Removal**
   - **Issue:** Multi-platform environments (Windows/macOS/Linux) can append invisible carriage returns (`\r\n`) or trailing spaces when parsing `.env` files, causing 401 Unauthorized errors from API endpoints.
   - **Handling:** Environment variable strings are sanitized using regex (`.replace(/[\r\n]/g, "")`) and search terms are URL-encoded (`encodeURIComponent()`).