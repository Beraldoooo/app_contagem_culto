type Tom = "erro" | "aviso" | "info";

const ESTILOS: Record<Tom, string> = {
  erro: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200",
  aviso:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
  info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200",
};

export function Alerta({
  tom = "info",
  children,
}: {
  tom?: Tom;
  children: React.ReactNode;
}) {
  return (
    <p
      role={tom === "erro" ? "alert" : "status"}
      className={`rounded-lg border px-3 py-2.5 text-sm ${ESTILOS[tom]}`}
    >
      {children}
    </p>
  );
}
