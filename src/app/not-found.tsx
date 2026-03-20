import NotFoundGame from "@/components/NotFoundGame";

export default function RootNotFound() {
  return (
    <html lang="en">
      <head>
        <title>404 — Trap Architect</title>
        <meta name="description" content="This page fell into a trap! Play the impossible 404 level." />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, background: "#0a0a0a" }}>
        <NotFoundGame />
      </body>
    </html>
  );
}
