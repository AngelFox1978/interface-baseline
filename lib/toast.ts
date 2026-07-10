import { toast } from "sonner";

// Helpers de notification standardisés du template : toujours passer par
// notifySuccess / notifyError plutôt que par sonner directement, pour garder
// un usage uniforme (et pouvoir changer de librairie en un seul endroit).
// Les messages sont déjà traduits par l'appelant (clés next-intl).

export function notifySuccess(message: string): void {
  toast.success(message);
}

export function notifyError(message: string): void {
  toast.error(message);
}
