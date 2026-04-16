import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function useSubscribeNewsletter() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (email: string) => {
      // Simulate API network request delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      if (!email.includes("@")) throw new Error("Érvénytelen email cím");
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Sikeres feliratkozás! 🎉",
        description: "Hamarosan küldjük a legújabb UX és design tartalmakat.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Hiba történt",
        description: error.message || "Kérjük próbáld újra később.",
      });
    }
  });
}
