import { HttpClient } from "./http/HttpClient";
import { AuthRepository } from "./repositories/AuthRepository";
import { ServiceRepository } from "./repositories/ServiceRepository";
import { createAuthService } from "@/application/services/authService";
import { createCatalogService } from "@/application/services/catalogService";
import { StaffRepository } from "./repositories/StaffRepository";
import { createStaffService } from "@/application/services/staffService";

/* v8 ignore next 1: Fallback para ambiente de dev */
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5180";

class Container {
    private static instance: Container;
    private services = new Map<string, unknown>();
    public httpClient: HttpClient;

    private constructor() {
        this.httpClient = new HttpClient(API_URL);
        const authRepository = new AuthRepository(this.httpClient);
        const serviceRepository = new ServiceRepository(this.httpClient);
        const authService = createAuthService(authRepository);
        const catalogService = createCatalogService(serviceRepository);
        const staffRepository = new StaffRepository(this.httpClient);
        const staffService = createStaffService(staffRepository);

        this.services.set("IAuthRepository", authRepository);
        this.services.set("AuthService", authService);
        this.services.set("IServiceRepository", serviceRepository);
        this.services.set("CatalogService", catalogService);
        this.services.set("IStaffRepository", staffRepository);
        this.services.set("StaffService", staffService);
    }

    /* v8 ignore next 4: Singleton pattern, instance creation is covered by module load */
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
