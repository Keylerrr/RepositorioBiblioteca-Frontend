"use client";

import { createContext, useContext, useMemo } from "react";
import { createAccountsApi } from "@/shared/services/apiClient";

const AccountsContext = createContext(null);

export default function AccountsProvider({ mutateAction, children }) {
  const api = useMemo(() => createAccountsApi(mutateAction), [mutateAction]);
  return <AccountsContext.Provider value={api}>{children}</AccountsContext.Provider>;
}

export function useAccountsApi() {
  const api = useContext(AccountsContext);
  if (!api) throw new Error("Los componentes de cuentas requieren AccountsGateway.");
  return api;
}
