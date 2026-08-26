import { config } from "@vue/test-utils";
import { Quasar } from "quasar";
import { createTestingPinia } from "@pinia/testing";

config.global.plugins.push([Quasar, {}]);
config.global.plugins.push(createTestingPinia());
