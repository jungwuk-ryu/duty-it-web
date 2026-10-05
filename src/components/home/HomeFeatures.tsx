import { getHomePreviewData } from "./home-preview-data";
import HomeFeaturesClient from "./HomeFeaturesClient";

export default async function HomeFeatures() {
  const { events, jobs } = await getHomePreviewData();
  return <HomeFeaturesClient events={events} jobs={jobs} />;
}
