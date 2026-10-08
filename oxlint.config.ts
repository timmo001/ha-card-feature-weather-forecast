import { defineConfig } from "oxlint";
import recommended from "@timmo001/oxlint-rules/configs/recommended";

export default defineConfig({
  extends: [recommended],
  ignorePatterns: ["vendor/**", ".agents/skills/**"],
  options: {
    typeAware: true,
    typeCheck: true,
    maxWarnings: 0,
  },
});
