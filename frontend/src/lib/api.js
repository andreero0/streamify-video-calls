import { axiosInstance } from "./axios";

// Auth APIs
export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    console.log("Error in getAuthUser:", error);
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

export const updateProfile = async (userData) => {
  const response = await axiosInstance.put("/auth/update-profile", userData);
  return response.data;
};

export const verifyEmail = async (token) => {
  const response = await axiosInstance.post("/auth/verify-email", { token });
  return response.data;
};

export const resendVerificationEmail = async () => {
  const response = await axiosInstance.post("/auth/resend-verification");
  return response.data;
};

export const requestPasswordReset = async (email) => {
  const response = await axiosInstance.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await axiosInstance.post("/auth/reset-password", { token, password });
  return response.data;
};

export const deleteAccount = async (password) => {
  const response = await axiosInstance.delete("/auth/delete-account", { data: { password } });
  return response.data;
};

// User APIs
export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends");
  return response.data;
}

export async function getRecommendedUsers(params) {
  const response = await axiosInstance.get("/users", { params });
  return response.data;
}

export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
}

export async function declineFriendRequest(requestId) {
  const response = await axiosInstance.delete(`/users/friend-request/${requestId}/decline`);
  return response.data;
}

export async function cancelFriendRequest(requestId) {
  const response = await axiosInstance.delete(`/users/friend-request/${requestId}/cancel`);
  return response.data;
}

export async function unfriend(userId) {
  const response = await axiosInstance.delete(`/users/unfriend/${userId}`);
  return response.data;
}

// Chat APIs
export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
}
