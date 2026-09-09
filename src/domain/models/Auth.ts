export interface User {
    id?: string;
    name?: string;
    email: string;
    role: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthResult {
    token: string;
    refreshToken: string;
    email: string;
    role: string;
}
