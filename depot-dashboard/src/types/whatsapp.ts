export type SubscriptionTier = "Standard" | "Basic" | "Advanced" | "Elite";

export interface WhatsAppGroup {
  depotId: string;
  depotName?: string;
  lienInvitation: string;
  nombreMembres: number;
  adminPrincipal: string;
  adminSecondaire: string;
  createdAt: Date;
  updatedAt: Date;
}
