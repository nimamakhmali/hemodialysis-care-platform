'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { educationService } from '../services/education.service'
import { QUERY_KEYS } from '@/lib/query/queryClient'
import toast from 'react-hot-toast'

export function useEducationList(params?: {
  page?: number
  size?: number
  search?: string
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.education, params],
    queryFn: () => educationService.getAll(params),
    staleTime: 10 * 60 * 1000,
  })
}

export function useEducationDetail(topicCode: string) {
  return useQuery({
    queryKey: QUERY_KEYS.educationDetail(topicCode),
    queryFn: () => educationService.getByTopic(topicCode),
    enabled: !!topicCode,
    staleTime: 30 * 60 * 1000,
  })
}

export function useRelevantEducation(patientId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.relevantEducation(patientId),
    queryFn: () => educationService.getRelevant(patientId),
    enabled: !!patientId,
    staleTime: 10 * 60 * 1000,
  })
}

export function useUpdateEducation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      educationService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.education] })
      toast.success('محتوا با موفقیت ویرایش شد')
    },
    onError: () => toast.error('خطا در ویرایش محتوا'),
  })
}