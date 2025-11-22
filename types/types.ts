// /home/jedryczkatymon/cookify/types/types.ts

export type DateTime = string; // ISO date string

export interface User {
    id: string; // cuid()
    clerkId: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    imageUrl?: string | null;
    createdAt: DateTime;
    updatedAt: DateTime;
    lastSignInAt?: DateTime | null;
    lastActivedAt?: DateTime | null;
    legalAcceptedAt?: DateTime | null;
    banned: boolean;
    recipes?: Recipe[]; // relations
    uploads?: Upload[]; // relations
}

export interface Recipe {
    id: number;
    slug: string;
    name: string;
    description?: string | null;
    tags: string[]; // e.g. ["wegetariańskie", "bezglutenowe"]
    cuisine?: string | null; // e.g. "Kuchnia amerykańska"
    category?: string | null; // e.g. "Kolacje", "Lunche"
    servings?: number | null;
    prepTime?: number | null; // minutes
    createdAt: DateTime;
    updatedAt: DateTime;
    ingredients?: Ingredient[]; // relations
    steps?: Step[]; // relations
    notes?: string | null;
    createdBy: User;
    createdById: string;
    uploads?: Upload[]; // relations
}

export interface Step {
    id: number;
    order: number;
    content: string;
    recipe: Recipe;
    recipeId: number;
}

export interface Ingredient {
    id: number;
    name: string;
    amount?: number | null;
    unit?: string | null;
    section?: string | null;
    recipe: Recipe;
    recipeId: number;
}

export interface Upload {
    id: string; // cuid()
    url: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    createdAt: DateTime;
    recipe?: Recipe | null;
    recipeId?: number | null;
    uploadedBy: User;
    uploadedById: string;
}