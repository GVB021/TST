import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AudioWaveform, Download, Loader2, Music4 } from "lucide-react";
import { useProductions } from "@/hooks/use-productions";
import { authFetch } from "@/lib/auth-fetch";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, PageSection } from "@/components/ui/design-system";

interface TimelineTake {
  id: string;
  startTimeSeconds: number;
  durationSeconds: number;
  isActive: boolean;
  audioUrl: string;
}

interface TimelineTrack {
  id: string;
  name: string;
  color: string;
  takes: TimelineTake[];
}

interface TimelineResponse {
  productionId: string;
  tracks: TimelineTrack[];
  totalDurationSeconds: number;
}

function formatTimecode(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hh = String(Math.floor(safeSeconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, "0");
  const ss = String(safeSeconds % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export default function Daw({ studioId }: { studioId: string }) {
  const { data: productions, isLoading: isProductionsLoading } = useProductions(studioId);
  const [productionId, setProductionId] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!productionId && productions?.length) {
      setProductionId(productions[0]!.id);
    }
  }, [productions, productionId]);

  const timelineQuery = useQuery<TimelineResponse>({
    queryKey: ["/api/productions", productionId, "timeline"],
    queryFn: () => authFetch(`/api/productions/${productionId}/timeline`),
    enabled: Boolean(productionId),
    refetchInterval: 15000,
  });

  const bounceMutation = useMutation({
    mutationFn: async (mode: "full_track" | "multitrack") => {
      return authFetch(`/api/productions/${productionId}/bounce`, {
        method: "POST",
        body: JSON.stringify({ mode }),
      });
    },
    onSuccess: (data: any) => {
      const firstOutput = Array.isArray(data?.outputs) ? data.outputs[0] : null;
      const url = firstOutput?.signedUrl || firstOutput?.public_url;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      toast({
        title: "Bounce finalizado",
        description: data?.mode === "multitrack" ? "Pacote multitrack gerado com sucesso." : "Mix completo gerado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Falha no bounce",
        description: error?.message || "Nao foi possivel processar o audio.",
        variant: "destructive",
      });
    },
  });

  const tracks = timelineQuery.data?.tracks || [];
  const totalDurationSeconds = useMemo(() => {
    const fromApi = timelineQuery.data?.totalDurationSeconds || 0;
    return Math.max(60, Math.ceil(fromApi / 10) * 10);
  }, [timelineQuery.data?.totalDurationSeconds]);

  const pixelsPerSecond = 44;
  const timelineWidth = totalDurationSeconds * pixelsPerSecond;
  const timeMarkers = useMemo(
    () => Array.from({ length: Math.floor(totalDurationSeconds / 10) + 1 }, (_, index) => index * 10),
    [totalDurationSeconds]
  );

  return (
    <PageSection className="max-w-[1700px] mx-auto space-y-6">
      <PageHeader
        title="Estúdio Virtual"
        subtitle="Timeline ativa de takes por personagem e ator com bounce server-side."
        action={
          <div className="flex items-center gap-2">
            <Select value={productionId} onValueChange={setProductionId}>
              <SelectTrigger className="w-[240px] h-9 bg-background/60 border-white/10">
                <SelectValue placeholder={isProductionsLoading ? "Carregando..." : "Selecione a producao"} />
              </SelectTrigger>
              <SelectContent>
                {(productions || []).map((production) => (
                  <SelectItem key={production.id} value={production.id}>
                    {production.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 border-white/15"
              disabled={!productionId || bounceMutation.isPending}
              onClick={() => bounceMutation.mutate("full_track")}
            >
              {bounceMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Bounce Full
            </Button>
            <Button
              size="sm"
              className="gap-2"
              disabled={!productionId || bounceMutation.isPending}
              onClick={() => bounceMutation.mutate("multitrack")}
            >
              {bounceMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AudioWaveform className="h-3.5 w-3.5" />}
              Bounce Multitrack
            </Button>
          </div>
        }
      />

      <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md overflow-hidden">
        <div className="grid grid-cols-[280px_1fr] border-b border-white/10">
          <div className="px-5 py-3 text-xs uppercase tracking-[0.18em] text-white/45">Tracks</div>
          <div className="overflow-x-auto">
            <div className="relative h-12" style={{ width: timelineWidth }}>
              {timeMarkers.map((second) => (
                <div
                  key={second}
                  className="absolute top-0 bottom-0 border-l border-white/10"
                  style={{ left: second * pixelsPerSecond }}
                >
                  <span className="absolute top-2 left-2 text-[11px] font-mono text-white/50">
                    {formatTimecode(second)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {timelineQuery.isLoading ? (
          <div className="h-40 flex items-center justify-center text-white/60">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Carregando timeline...
          </div>
        ) : tracks.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-white/40 gap-2">
            <Music4 className="h-6 w-6" />
            Nenhum take ativo encontrado para esta producao.
          </div>
        ) : (
          <div className="max-h-[68vh] overflow-auto custom-scrollbar">
            {tracks.map((track) => (
              <div key={track.id} className="grid grid-cols-[280px_1fr] border-b border-white/5 min-h-[64px]">
                <div className="px-5 py-4 flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: track.color || "#60A5FA" }} />
                  <span className="text-sm font-medium text-white/85 truncate">{track.name}</span>
                </div>
                <div className="overflow-x-auto">
                  <div className="relative h-[64px]" style={{ width: timelineWidth }}>
                    {timeMarkers.map((second) => (
                      <div
                        key={`${track.id}-${second}`}
                        className="absolute top-0 bottom-0 border-l border-white/[0.05]"
                        style={{ left: second * pixelsPerSecond }}
                      />
                    ))}
                    {track.takes.filter((take) => take.isActive).map((take) => (
                      <motion.div
                        key={take.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.24 }}
                        className="absolute top-3 h-8 rounded-md border text-[11px] font-medium px-2 flex items-center"
                        style={{
                          left: take.startTimeSeconds * pixelsPerSecond,
                          width: Math.max(36, take.durationSeconds * pixelsPerSecond),
                          borderColor: `${track.color || "#60A5FA"}66`,
                          backgroundColor: `${track.color || "#60A5FA"}2E`,
                          color: "#E5E7EB",
                        }}
                        title={`${track.name} • ${formatTimecode(take.startTimeSeconds)} • ${take.durationSeconds.toFixed(2)}s`}
                      >
                        {formatTimecode(take.startTimeSeconds)}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageSection>
  );
}
