"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function useRequireAuth(): boolean {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { token, isPending } = useAuthStore.getState();
    if (!token) {
      router.replace("/auth");
    } else if (isPending) {
      router.replace("/auth/profile");
    } else {
      setReady(true);
    }
  }, [router]);

  return ready;
}
