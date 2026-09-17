export interface VeterinaryService {
    id: string;
    name: string;
    description: string | null;
    durationInMinutes: number;
    price: number;
    requiresVeterinarian: boolean;
}

