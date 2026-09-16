import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useI18n } from "@/i18n"

export function Toaster() {
  const { toasts } = useToast()
  const { t } = useI18n()
  const hasOpenToast = toasts.some(({ open }) => open !== false)

  return (
    <ToastProvider label={t("toast.providerLabel")}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose aria-label={t("toast.closeLabel")} />
          </Toast>
        )
      })}
      <ToastViewport
        active={hasOpenToast}
        label={t("toast.viewportLabel")}
      />
    </ToastProvider>
  )
}
