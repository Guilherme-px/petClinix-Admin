export type Species = "Dog" | "Cat" | "Bird" | "Reptile" | "Fish" | "Other";
export type PetSex = "Male" | "Female"; 

export interface Pet {
    id: string;
    name: string;
    species: Species;
    breed: string | null;
    birthDate: string | null;
    sex: PetSex;
    weight: number | null;
    isNeutered: boolean;
    notes: string | null;
}

export interface PetPayload {
    name: string;
    species: Species;
    breed: string | null;
    birthDate: string | null;
    sex: PetSex;
    weight: number | null;
    isNeutered: boolean;
    notes: string | null;
}

export const SPECIES_LABELS: Record<Species, string> = {
    Dog: "Cão",
    Cat: "Gato",
    Bird: "Ave",
    Reptile: "Réptil",
    Fish: "Peixe",
    Other: "Outro",
};

export const SPECIES_OPTIONS = Object.entries(SPECIES_LABELS).map(([value, label]) => ({
    label,
    value: value as Species,
}));

export const PET_SEX_LABELS: Record<PetSex, string> = {
    Male: "Macho",
    Female: "Fêmea",
};

export const PET_SEX_OPTIONS = Object.entries(PET_SEX_LABELS).map(([value, label]) => ({
    label,
    value: value as PetSex,
}));
