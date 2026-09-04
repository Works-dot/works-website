import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n";

type NewsletterResult = {
  ok: boolean;
  code: "subscribed";
};

const NEWSLETTER_API_URL = import.meta.env.DEV
  ? "/api/newsletter/subscribe"
  : "https://works-website.replit.app/api/newsletter/subscribe";

export class NewsletterError extends Error {
  constructor(public readonly code: "invalid_email" | "provider_error") {
    super(code);
  }
}

export function useSubscribeNewsletter() {
  const { toast } = useToast();
  const { t } = useI18n();
  
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(NEWSLETTER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const result = await response.json().catch(() => null) as
        | NewsletterResult
        | { ok: false; code?: string }
        | null;

      if (!response.ok || !result?.ok) {
        throw new NewsletterError(result?.code === "invalid_email" ? "invalid_email" : "provider_error");
      }

      return result as NewsletterResult;
    },
    onSuccess: () => {
      toast({
        title: t("footer.newsletterSuccessTitle"),
        description: t("footer.newsletterSuccessDescription"),
      });
    },
    onError: (error) => {
      const isInvalidEmail = error instanceof NewsletterError && error.code === "invalid_email";
      toast({
        variant: "destructive",
        title: t("footer.newsletterErrorTitle"),
        description: isInvalidEmail
          ? t("footer.newsletterInvalidEmail")
          : t("footer.newsletterErrorDescription"),
      });
    }
  });
}
