"use client";
import { useCallback, useEffect, useState } from "react";

export type GeolocationStatus = "idle" | "asking" | "granted" | "denied" | "unavailable" | "failed";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Duas casas decimais (cerca de 1 km): basta para "perto de você" e não guarda o ponto exato de quem busca. */
const round = (value: number) => Math.round(value * 100) / 100;
const PERMISSION_DENIED = 1;

/**
 * Posição do navegador sob demanda. Só pede ao gesto de `request()`; se a permissão já estiver concedida, busca
 * sozinha. A posição fica só neste estado: nunca vai para URL, storage nem log.
 *
 * @example const { status, coords, request } = useGeolocation(); <Button onClick={request}>Usar minha localização</Button>
 */
export function useGeolocation() {
  const [state, setState] = useState<{ status: GeolocationStatus; coords: Coordinates | null }>({
    status: "idle",
    coords: null,
  });

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "unavailable", coords: null });
      return;
    }
    setState((current) => ({ ...current, status: "asking" }));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setState({
          status: "granted",
          coords: { latitude: round(coords.latitude), longitude: round(coords.longitude) },
        }),
      (error) => setState({ status: error.code === PERMISSION_DENIED ? "denied" : "failed", coords: null }),
      { maximumAge: 300_000, timeout: 10_000 },
    );
  }, []);

  useEffect(() => {
    let active = true;
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((permission) => {
        if (active && permission.state === "granted") request();
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [request]);

  return { ...state, request };
}
