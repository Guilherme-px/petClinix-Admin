import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            redirect: "/login",
        },
        {
            path: "/login",
            name: "login",
            component: () => import("@/pages/auth/LoginPage.vue"),
        },
        {
            path: "/appointments",
            name: "appointments",
            component: () => import("@/pages/AppointmentsPage.vue"),
        },
    ],
});

export default router;
