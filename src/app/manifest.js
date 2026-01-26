export default function manifest() {
    return {
      name: "Pinguim Manoa - Point",
      short_name: "Point",
      description: "Sistema de Gestão de Ponto",
      start_url: "/",
      display: "standalone",
      background_color: "#f5f5f5",
      theme_color: "#1351b4",
      icons: [
        {
          src: "/icon.svg",
          sizes: "any",
          type: "image/svg+xml",
          purpose: "any",
        },
      ],
    };
  }
  