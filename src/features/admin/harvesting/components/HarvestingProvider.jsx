"use client";

import { createContext, useContext, useMemo } from "react";
import { createHarvestingApi } from "@/features/admin/harvesting/harvesting";

const HarvestingContext = createContext(null);

export default function HarvestingProvider({ mutateAction, children }) {
  const api = useMemo(() => createHarvestingApi(mutateAction), [mutateAction]);
  return <HarvestingContext.Provider value={api}>{children}</HarvestingContext.Provider>;
}

export function useHarvestingApi() {
  const api = useContext(HarvestingContext);
  if (!api) throw new Error("Los componentes de cosecha requieren HarvestingProvider.");
  return api;
}
