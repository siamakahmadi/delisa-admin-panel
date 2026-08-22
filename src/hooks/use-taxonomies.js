"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await apiClient.get("/api/admin/categories")).data,
    staleTime: 60_000,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => (await apiClient.get("/api/brands")).data,
    staleTime: 60_000,
  });
}

export function useProductTypes() {
  return useQuery({
    queryKey: ["product-types"],
    queryFn: async () => (await apiClient.get("/api/product-types")).data,
    staleTime: 60_000,
  });
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => (await apiClient.get("/api/admin/tags")).data,
    staleTime: 60_000,
  });
}
