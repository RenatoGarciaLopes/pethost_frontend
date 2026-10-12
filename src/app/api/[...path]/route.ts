import { createBffProxy } from "@/shared/api/server/proxyToBackend";

/** Proxy do BFF para a API pela lista permitida (spec 003, REQ-HTTP-009 a 014). */
const proxy = createBffProxy();

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
