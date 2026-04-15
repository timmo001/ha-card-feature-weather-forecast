import { defineConfig } from "rolldown";
import {
  getBabelInputPlugin,
  getBabelOutputPlugin,
} from "@rollup/plugin-babel";
import serve from "rollup-plugin-serve";

const serveOptions = {
  contentBase: ["./dist"],
  host: "0.0.0.0",
  port: 4000,
  allowCrossOrigin: true,
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
};

export default defineConfig(({ watch }) => {
  const plugins = [
    getBabelInputPlugin({
      babelHelpers: "bundled",
    }),
    getBabelOutputPlugin({
      presets: [
        [
          "@babel/preset-env",
          {
            modules: false,
          },
        ],
      ],
      compact: true,
    }),
    ...(watch ? [serve(serveOptions)] : []),
  ];

  return {
    input: "src/card/ha-card-feature-weather-forecast.ts",
    tsconfig: "./tsconfig.json",
    output: {
      dir: "dist",
      format: "es",
      codeSplitting: false,
      minify: !watch,
    },
    plugins,
  };
});
