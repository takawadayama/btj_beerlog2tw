import axios, { AxiosError } from "axios";

interface UserNameResponse {
  user_name: string;
}

export async function getUserName(token: string): Promise<string | null> {
  try {
    const response = await axios.get<UserNameResponse>(process.env.NEXT_PUBLIC_API_ENDPOINT + "/username/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.user_name;
  } catch (error) {
    const axiosError = error as AxiosError;

    if (axiosError.response?.status === 401) {
      // Unauthorizedエラーの場合
      return "Unauthorized";
    } else {
      console.error("Failed to fetch user name:", error);
      return null;
    }
  }
}
