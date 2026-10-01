export const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    return value;
};

export const formatCpf = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export const formatDuration = (minutes: number) => {
    if (minutes === 0) return "Sem duração fixa";
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}min`;
};
