import { useQuery } from "@tanstack/react-query";

export function useSystemStatus() {
  return useQuery({
    queryKey: ["/api/system-status"],
    refetchInterval: 5000, // Update every 5 seconds
  });
}
