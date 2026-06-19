"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useProgressStore } from "@/store/progressStore";
import { getClientId } from "@/utils/storage";

function serializeProgress(data: {
  clientId: string;
  completedUnits: string[];
  unitScores: Record<string, number>;
  wrongQuestions: string[];
}) {
  return JSON.stringify(data);
}

export function ProgressSync() {
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    setClientId(getClientId());
  }, []);

  const serverProgress = useQuery(
    api.progress.getByClient,
    clientId ? { clientId } : "skip",
  );
  const saveProgress = useMutation(api.progress.saveProgress);
  const hydrateFromServer = useProgressStore((s) => s.hydrateFromServer);
  const completedUnits = useProgressStore((s) => s.completedUnits);
  const unitScores = useProgressStore((s) => s.unitScores);
  const wrongQuestions = useProgressStore((s) => s.wrongQuestions);

  const hydratedRef = useRef(false);
  const lastSavedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!serverProgress || !clientId) return;

    if (!hydratedRef.current) {
      const id = clientId;
      hydrateFromServer(serverProgress);
      hydratedRef.current = true;
      lastSavedRef.current = serializeProgress({
        clientId: id,
        completedUnits: serverProgress.completedUnits,
        unitScores: serverProgress.unitScores,
        wrongQuestions: serverProgress.wrongQuestions,
      });
    }
  }, [serverProgress, hydrateFromServer, clientId]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) return;
    if (!clientId) return;
    if (!hydratedRef.current) return;

    const payload = {
      clientId,
      completedUnits,
      unitScores,
      wrongQuestions,
    };
    const serialized = serializeProgress(payload);
    if (serialized === lastSavedRef.current) return;

    lastSavedRef.current = serialized;
    saveProgress(payload).catch(() => {
      // Convex未接続時はLocalStorageのみで動作
    });
  }, [clientId, completedUnits, unitScores, wrongQuestions, saveProgress]);

  return null;
}
