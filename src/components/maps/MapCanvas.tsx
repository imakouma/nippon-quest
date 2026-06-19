import type { MapId } from "@/types/question";
import { CityDistrictMap } from "./CityDistrictMap";
import { JapanRegionMap } from "./JapanRegionMap";

interface MapCanvasProps {
  mapId: MapId;
}

export function MapCanvas({ mapId }: MapCanvasProps) {
  switch (mapId) {
    case "city_district":
      return <CityDistrictMap />;
    case "japan_prefectures":
      return <JapanRegionMap mode="prefectures" />;
    case "japan_islands":
      return <JapanRegionMap mode="islands" />;
    case "japan_regions":
      return <JapanRegionMap mode="regions" />;
    default:
      return null;
  }
}
