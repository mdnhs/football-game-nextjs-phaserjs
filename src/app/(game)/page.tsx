"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

function HomeRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const ref = params.get("ref");
    const { setQrRef, token, isPending } = useAuthStore.getState();
    if (ref) setQrRef(ref);

    if (!token) {
      router.replace("/auth");
    } else if (isPending) {
      router.replace("/auth/profile");
    } else {
      router.replace("/menu");
    }
  }, [params, router]);

  return null;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeRedirect />
    </Suspense>
  );
}
