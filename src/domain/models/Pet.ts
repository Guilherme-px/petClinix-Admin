export type Species = "Dog" | "Cat";
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
