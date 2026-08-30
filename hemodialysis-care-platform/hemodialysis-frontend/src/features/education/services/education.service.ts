// src/features/education/services/education.service.ts
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  EducationContent,
  EducationCreateRequest,
  EducationUpdateRequest,
  EducationFilters,
} from "../types/education.types";

export const educationService = {
  getAll: async (filters?: EducationFilters): Promise<EducationContent[]> => {
    const res = await apiClient.get(API_ENDPOINTS.education.list, {
      params: filters,
    });
    return res.data?.data ?? res.data ?? [];
  },

  getByTopicCode: async (topicCode: string): Promise<EducationContent> => {
    const res = await apiClient.get(
      API_ENDPOINTS.education.detail(topicCode)
    );
    return res.data?.data ?? res.data;
  },

  getRelevant: async (patientId: string): Promise<EducationContent[]> => {
    const res = await apiClient.get(
      API_ENDPOINTS.education.relevant(patientId)
    );
    return res.data?.data ?? res.data ?? [];
  },

  search: async (query: string): Promise<EducationContent[]> => {
    const res = await apiClient.get("/education/search/", {
      params: { q: query },
    });
    return res.data?.data ?? res.data ?? [];
  },

  create: async (
    data: EducationCreateRequest
  ): Promise<EducationContent> => {
    const res = await apiClient.post(API_ENDPOINTS.education.create, data);
    return res.data?.data ?? res.data;
  },

  update: async (
    id: string,
    data: EducationUpdateRequest
  ): Promise<EducationContent> => {
    const res = await apiClient.put(
      API_ENDPOINTS.education.update(id),
      data
    );
    return res.data?.data ?? res.data;
  },
};