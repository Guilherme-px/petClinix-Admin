import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            redirect: "/appointments",
        },
        {
            path: "/login",
            name: "login",
            component: () => import("@/pages/auth/LoginPage.vue"),
            meta: { guestOnly: true },
        },
        {
            path: "/appointments",
            name: "appointments",
            component: () => import("@/pages/AppointmentsPage.vue"),
            meta: { requiresAuth: true },
        },
    ],
});

router.beforeEach((to) => {
    const authStore = useAuthStore();

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        return { name: "login" };
    }

    if (to.meta.guestOnly && authStore.isAuthenticated) {
        return { name: "appointments" };
    }

    return true;
});

export default router;
