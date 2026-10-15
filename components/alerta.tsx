type Tom = "erro" | "aviso" | "info";

const ESTILOS: Record<Tom, string> = {
  erro: "bg-perigo-suave text-perigo-texto",
  aviso: "bg-aviso-suave text-aviso-texto",
  info: "bg-marca-suave text-marca-texto",
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
      className={`rounded-campo px-3.5 py-3 text-sm ${ESTILOS[tom]}`}
    >
      {children}
    </p>
  );
}
