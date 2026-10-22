import api from "../../../services/api.client";

/**
 * @description Service to record a meeting in the logged-in user's history
 */
export async function addToHistory(meetingCode) {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const response = await api.post("/api/v1/users/add_to_activity", {
      meeting_code: meetingCode,
    });
    return response.data;
  } catch (err) {
    // Return null silently for guests or invalid tokens
    return null;
  }
}

/**
 * @description Service to fetch all meeting history for the logged-in user
 */
export async function getUserHistory() {
  const token = localStorage.getItem("token");
  if (!token) return [];

  try {
    const response = await api.get("/api/v1/users/get_all_activity");
    return response.data || [];
  } catch (err) {
    console.error("Failed to fetch meeting history:", err);
    return [];
  }
}
