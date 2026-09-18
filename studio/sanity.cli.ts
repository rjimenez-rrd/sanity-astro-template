/**
 * Sanity CLI Configuration
 * This file configures the Sanity CLI tool with project-specific settings
 * and customizes the Vite bundler configuration.
 * Learn more: https://www.sanity.io/docs/cli
 */

import { defineCliConfig } from "sanity/cli";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET;

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  studioHost: process.env.SANITY_STUDIO_STUDIO_HOST || "",
  deployment: {
    appId: 'ajjd8m5al71xno14g4pliy7i',
    autoUpdates: true,
  },
  typegen: {
    path: '../frontend-astro/src/**/*.{ts,tsx}',
    generates: '../frontend-astro/src/sanity/types.ts',
  },
});
