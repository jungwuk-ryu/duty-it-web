import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: "/", name: "듀잇", short_name: "듀잇",
        description: "간호사와 간호대학생을 위한 행사와 채용 소식",
        lang: "ko", start_url: "/notifications", scope: "/", display: "standalone",
        background_color: "#FFFFFF", theme_color: "#C63C33",
        icons: [{ src: "/app-icon.png", sizes: "230x230", type: "image/png", purpose: "any" }],
    };
}
