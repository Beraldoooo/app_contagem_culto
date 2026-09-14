import type { InputHTMLAttributes } from "react";

type CampoProps = InputHTMLAttributes<HTMLInputElement> & {
  rotulo: string;
  dica?: string;
};

export function Campo({ rotulo, dica, id, ...props }: CampoProps) {
  const campoId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={campoId} className="text-sm font-medium">
        {rotulo}
      </label>
      <input
        id={campoId}
        className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
        {...props}
      />
      {dica ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{dica}</p>
      ) : null}
    </div>
  );
}
