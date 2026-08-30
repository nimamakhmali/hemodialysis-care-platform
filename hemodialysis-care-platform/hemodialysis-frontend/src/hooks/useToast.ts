import toast from 'react-hot-toast'

export function useToast() {
  const success = (message: string, duration = 3000) =>
    toast.success(message, { duration })

  const error = (message: string, duration = 5000) =>
    toast.error(message, { duration })

  const loading = (message: string) =>
    toast.loading(message)

  const dismiss = (id?: string) =>
    id ? toast.dismiss(id) : toast.dismiss()

  const promise = <T>(
    prom: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) => toast.promise(prom, messages)

  const custom = (message: string, options?: Parameters<typeof toast>[1]) =>
    toast(message, options)

  return { success, error, loading, dismiss, promise, custom }
}