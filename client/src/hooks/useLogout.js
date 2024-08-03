import { useAuthContext } from "./useAuthContext";

const useLogout = () => {
  const { dispatch: logoutDispatch } = useAuthContext();

  const logout = () => {
    // clear localstorage
    localStorage.clear()
    

    // dispatch logout
    logoutDispatch({ type: "LOGOUT" });
  };

  return { logout };
};

export default useLogout;

