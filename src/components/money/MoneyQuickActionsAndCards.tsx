"use client";

import React from "react";
import {
  Wallet,
  Briefcase,
  Coffee,
  Home,
  Compass,
  DollarSign,
  Smile,
  ShoppingBag,
  Utensils,
  Car,
  Zap,
  Droplet,
  Gift,
  Film,
  Book,
  BookOpen,
  Heart,
  HeartPulse,
  Tag,
  PiggyBank,
  TrendingUp,
  Smartphone,
  CreditCard,
  Fuel,
  Plane,
  Dumbbell,
  Gamepad,
  Laptop,
  Target,
  Sparkles,
  Landmark,
  Building2,
  GraduationCap,
  Music,
  Shield,
  ShieldCheck,
  Banknote,
  Receipt,
  Percent,
  Coins,
} from "lucide-react";
import { CategoryChipFilterRail } from "@/components/money/CategoryChipFilterRail";

// Map string icon names to crisp Lucide line icons
export function CategoryIcon({
  name,
  className = "size-3.5",
}: {
  name: string | undefined;
  className?: string;
}) {
  const iconMap: Record<string, React.ElementType> = {
    briefcase: Briefcase,
    coffee: Coffee,
    home: Home,
    compass: Compass,
    dollarsign: DollarSign,
    dollar: DollarSign,
    smile: Smile,
    wallet: Wallet,
    shoppingbag: ShoppingBag,
    bag: ShoppingBag,
    utensils: Utensils,
    food: Utensils,
    car: Car,
    zap: Zap,
    droplet: Droplet,
    gift: Gift,
    film: Film,
    book: Book,
    bookopen: BookOpen,
    books: BookOpen,
    heart: Heart,
    heartpulse: HeartPulse,
    gym: HeartPulse,
    tag: Tag,
    shopping: Tag,
    piggybank: PiggyBank,
    savings: PiggyBank,
    trendingup: TrendingUp,
    smartphone: Smartphone,
    phone: Smartphone,
    upi: Smartphone,
    creditcard: CreditCard,
    card: CreditCard,
    fuel: Fuel,
    plane: Plane,
    travel: Plane,
    dumbbell: Dumbbell,
    gamepad: Gamepad,
    laptop: Laptop,
    target: Target,
    sparkles: Sparkles,
    landmark: Landmark,
    building: Building2,
    building2: Building2,
    bank: Building2,
    graduationcap: GraduationCap,
    music: Music,
    shield: Shield,
    shieldcheck: ShieldCheck,
    banknote: Banknote,
    cash: Banknote,
    receipt: Receipt,
    percent: Percent,
    coins: Coins,
  };

  const normalized = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const IconComponent = (normalized && iconMap[normalized]) ? iconMap[normalized] : Wallet;
  return <IconComponent className={className} strokeWidth={2.2} />;
}

export const renderCategoryEmoji = (icon: string | undefined): string => {
  return icon || "";
};

// Subtle semantic indicator accent for envelope edge
export function getCategoryAccent(cat: { type?: string; name: string }): string {
  const isIncome = cat.type === "income";
  if (isIncome) return "#03D26F";
  const nameLower = cat.name.toLowerCase();
  if (nameLower.includes("bill") || nameLower.includes("rent") || nameLower.includes("util")) {
    return "#64748B"; // slate
  }
  if (nameLower.includes("food") || nameLower.includes("grocer") || nameLower.includes("dining")) {
    return "#F59E0B"; // amber
  }
  if (nameLower.includes("study") || nameLower.includes("book") || nameLower.includes("course") || nameLower.includes("tuition")) {
    return "#C084FC"; // lavender
  }
  return "#161514";
}

export interface CategoryCardItem {
  id: string;
  name: string;
  amount: number;
  color: string;
  icon: string;
  type?: string;
  monthlyBudget?: number;
}

/**
 * @deprecated Use CategoryChipFilterRail instead. Re-exported for backwards compatibility.
 */
export const MoneyQuickActionsAndCards = CategoryChipFilterRail;
