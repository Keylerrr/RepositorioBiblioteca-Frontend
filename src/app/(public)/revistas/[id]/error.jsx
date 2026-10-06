"use client";

import ResourceError from "@/features/public/detail/components/ResourceError";

export default function Error({ retry }) {
  return <ResourceError retry={retry} />;
}