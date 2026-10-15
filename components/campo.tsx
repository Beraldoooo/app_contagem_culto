import type { InputHTMLAttributes } from "react";

import { classesCampo, classesRotulo } from "@/components/ui/base";

type CampoProps = InputHTMLAttributes<HTMLInputElement> & {
  rotulo: string;
  dica?: string;
};

export function Campo({ rotulo, dica, id, ...props }: CampoProps) {
  const campoId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={campoId} className={classesRotulo}>
        {rotulo}
      </label>
      <input
        id={campoId}
        className={classesCampo}
        {...props}
      />
      {dica ? (
        <p className="text-xs text-texto-3">{dica}</p>
      ) : null}
    </div>
  );
}
