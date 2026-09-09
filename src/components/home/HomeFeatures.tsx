import type { HomeEventPreview, HomeJobPreview } from "./home-preview-data";
import HomeFeaturesClient from "./HomeFeaturesClient";

type HomeFeaturesProps = {
  events: HomeEventPreview[];
  jobs: HomeJobPreview[];
};

export default function HomeFeatures({ events, jobs }: HomeFeaturesProps) {
  return <HomeFeaturesClient events={events} jobs={jobs} />;
}
