'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { patientsService } from '../services/patients.service'
import { QUERY_KEYS } from '@/lib/query/queryClient'
import toast from 'react-hot-toast'
import type {
  PatientFilters,
  CreatePatientRequest,
  UpdatePatientRequest,
} from '../types/patient.types'

export function usePatients(filters?: PatientFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.patients(filters as Record<string, unknown>),
    queryFn: () => patientsService.getList(filters),
    staleTime: 2 * 60 * 1000,
  })
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.patient(id),
    queryFn: () => patientsService.getDetail(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  })
}

export function usePatientSummary(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.patientSummary(id),
    queryFn: () => patientsService.getSummary(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePatientRequest) => patientsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.patients() })
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.clinicianDashboard] })
      toast.success('بیمار با موفقیت ثبت شد')
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response
        ?.status
      if (status === 409) {
        toast.error('کد بیمارستانی تکراری است')
      } else {
        toast.error('خطا در ثبت بیمار')
      }
    },
  })
}

export function useUpdatePatient(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdatePatientRequest) =>
      patientsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.patient(id) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.patients() })
      toast.success('اطلاعات بیمار به‌روز شد')
    },
    onError: () => toast.error('خطا در به‌روزرسانی'),
  })
}