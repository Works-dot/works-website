import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n";

export function useSubscribeNewsletter() {
  const { toast } = useToast();
  const { t } = useI18n();
  
  return useMutation({
    mutationFn: async (email: string) => {
      // Simulate API network request delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      if (!email.includes("@")) throw new Error("invalid-email");
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: t("footer.newsletterSuccessTitle"),
        description: t("footer.newsletterSuccessDescription"),
      });
    },
    onError: (error) => {
      const isInvalidEmail = error instanceof Error && error.message === "invalid-email";
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
