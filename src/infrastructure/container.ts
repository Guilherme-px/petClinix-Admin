import { HttpClient } from "./http/HttpClient";
import { AuthRepository } from "./repositories/AuthRepository";
import { createAuthService } from "@/application/services/authService";

const API_URL = import.meta.env.VITE_API_URL || "https://petclinix.onrender.com";

class Container {
    private static instance: Container;
    private services = new Map<string, unknown>();

    private constructor() {
        const httpClient = new HttpClient(API_URL);

        const authRepository = new AuthRepository(httpClient);

        const authService = createAuthService(authRepository);

        this.services.set("IAuthRepository", authRepository);
        this.services.set("AuthService", authService);
    }

    public static getInstance(): Container {
        if (!Container.instance) {
            Container.instance = new Container();
        }
        return Container.instance;
    }

    public resolve<T>(key: string): T {
        const service = this.services.get(key);
        if (!service) {
            throw new Error(`Service ${key} not found in container.`);
        }
        return service as T;
    }
}

export const container = Container.getInstance();
