export const auth = {
  getToken: (): string | null => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("access_token")
  },

  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem("access_token", accessToken)
    localStorage.setItem("refresh_token", refreshToken)
  },

  removeTokens: () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
  },

  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false
    return !!localStorage.getItem("access_token")
  },
}
