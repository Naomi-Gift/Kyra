/**
 * Catch-all route for Auth.js v5 API handlers.
 * Handles: GET/POST /api/auth/* (signin, signout, session, csrf, etc.)
 */

import { handlers } from "@/auth";

export const { GET, POST } = handlers;
